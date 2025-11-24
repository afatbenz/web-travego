import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X, Plus, Trash2, Upload, Clock, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export const PackageForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  // Sample data for edit mode
  const sampleData = {
    id: 1,
    title: 'Thailand Bangkok Tour Package - 4 Days 3 Nights',
    location: 'Bangkok, Thailand',
    duration: '4 Days 3 Nights',
    price: 2500000,
    originalPrice: 3000000,
    rating: 4.8,
    reviews: 24,
    participants: '2-8 pax',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=300&fit=crop',
    description: 'Paket wisata lengkap ke Bangkok dengan hotel bintang 4, transportasi AC, dan tour guide profesional.',
    features: ['Hotel bintang 4', 'Transportasi AC', 'Guide berbahasa Indonesia', 'Makan sesuai itinerary'],
    itinerary: [
      {
        day: 1,
        activities: [
          { time: '08:00', description: 'Tiba di Bangkok' },
          { time: '10:00', description: 'Check-in hotel' },
          { time: '14:00', description: 'City tour Bangkok' },
          { time: '19:00', description: 'Makan malam di restoran lokal' }
        ]
      },
      {
        day: 2,
        activities: [
          { time: '09:00', description: 'Kunjungi Grand Palace' },
          { time: '11:00', description: 'Wat Pho Temple' },
          { time: '14:00', description: 'Shopping di Chatuchak Market' },
          { time: '16:00', description: 'Makan siang di floating market' }
        ]
      }
    ]
  };

  const [formData, setFormData] = useState({
    title: isEdit ? sampleData.title : '',
    location: isEdit ? sampleData.location : '',
    packageType: 'overland',
    pickupLocation: '',
    coverageArea: [] as string[],
    destinations: [] as string[],
    duration: isEdit ? 4.0 : 0,
    price: isEdit ? sampleData.price : 0,
    originalPrice: isEdit ? sampleData.originalPrice : 0,
    minParticipants: 1,
    maxParticipants: 8,
    freePax: 0,
    status: isEdit ? sampleData.status : 'active',
    images: isEdit ? [sampleData.image] : [],
    description: isEdit ? sampleData.description : '',
    features: isEdit ? sampleData.features : [''],
    itinerary: isEdit ? sampleData.itinerary : [{ day: 1, activities: [{ time: '08:00', description: '' }] }] as { day: number; activities: { time: string; description: string }[] }[],
    addons: [{ name: '', description: '', price: 0 }]
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Judul paket wajib diisi';
    if (formData.duration <= 0) newErrors.duration = 'Durasi harus lebih dari 0';
    if (formData.price <= 0) newErrors.price = 'Harga harus lebih dari 0';
    if (formData.minParticipants <= 0) newErrors.minParticipants = 'Minimum peserta harus lebih dari 0';
    if (formData.maxParticipants <= 0) newErrors.maxParticipants = 'Maksimum peserta harus lebih dari 0';
    if (formData.minParticipants > formData.maxParticipants) newErrors.maxParticipants = 'Maksimum peserta harus lebih besar dari minimum peserta';
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
      navigate('/dashboard/services/packages');
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

  const handlePriceChange = (field: string, value: string) => {
    const numericValue = formatCurrency(value);
    handleInputChange(field, parseInt(numericValue) || 0);
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

  const addItineraryDay = () => {
    const newDay = formData.itinerary.length + 1;
    setFormData(prev => ({
      ...prev,
      itinerary: [...prev.itinerary, { day: newDay, activities: [{ time: '08:00', description: '' }] }]
    }));
  };

  const removeItineraryDay = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index)
    }));
  };

  const addActivity = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      itinerary: prev.itinerary.map((day, i) => 
        i === dayIndex 
          ? { ...day, activities: [...day.activities, { time: '08:00', description: '' }] }
          : day
      )
    }));
  };

  const removeActivity = (dayIndex: number, activityIndex: number) => {
    setFormData(prev => ({
      ...prev,
      itinerary: prev.itinerary.map((day, i) => 
        i === dayIndex 
          ? { ...day, activities: day.activities.filter((_, ai) => ai !== activityIndex) }
          : day
      )
    }));
  };

  const updateActivity = (dayIndex: number, activityIndex: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      itinerary: prev.itinerary.map((day, i) => 
        i === dayIndex 
          ? { ...day, activities: day.activities.map((activity, ai) => 
              ai === activityIndex 
                ? { ...(activity as { time: string; description: string }), description: value }
                : activity
            )}
          : day
      )
    }));
  };

  const updateItineraryTime = (dayIndex: number, activityIndex: number, time: string) => {
    setFormData(prev => ({
      ...prev,
      itinerary: prev.itinerary.map((day, i) => 
        i === dayIndex 
          ? { ...day, activities: day.activities.map((activity, ai) => 
              ai === activityIndex 
                ? { ...(activity as { time: string; description: string }), time }
                : activity
            )}
          : day
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

  const addToMultiSelect = (field: 'coverageArea' | 'destinations', value: string) => {
    const currentValues = formData[field] as string[];
    if (value.trim() && !currentValues.includes(value)) {
      setFormData(prev => ({
        ...prev,
        [field]: [...currentValues, value]
      }));
    }
  };

  const removeFromMultiSelect = (field: 'coverageArea' | 'destinations', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter(item => item !== value)
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
      
      // Preserve cursor position
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const cursorPosition = range.startOffset;
        
        // Restore cursor position after state update
        setTimeout(() => {
          if (editorRef.current && selection.rangeCount > 0) {
            const newRange = document.createRange();
            const textNode = editorRef.current.childNodes[0];
            if (textNode && textNode.nodeType === Node.TEXT_NODE) {
              const maxOffset = Math.min(cursorPosition, textNode.textContent?.length || 0);
              newRange.setStart(textNode, maxOffset);
              newRange.setEnd(textNode, maxOffset);
              selection.removeAllRanges();
              selection.addRange(newRange);
            }
          }
        }, 0);
      }
    }
  };


  const changeFontSize = (size: string) => {
    executeCommand('fontSize', size);
  };

  useEffect(() => {
    if (editorRef.current && formData.description) {
      // Only update if content is different to avoid cursor jumping
      if (editorRef.current.innerHTML !== formData.description) {
        const selection = window.getSelection();
        const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        
        editorRef.current.innerHTML = formData.description;
        
        // Restore cursor position if it was at the end
        if (range && editorRef.current && selection) {
          const textNode = editorRef.current.childNodes[0];
          if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            const newRange = document.createRange();
            newRange.setStart(textNode, textNode.textContent?.length || 0);
            newRange.setEnd(textNode, textNode.textContent?.length || 0);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
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
          onClick={() => navigate('/dashboard/services/packages')}
          className="!w-auto !h-auto p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Paket Wisata' : 'Tambah Paket Wisata'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {isEdit ? 'Ubah informasi paket wisata' : 'Tambahkan paket wisata baru'}
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
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Judul Paket *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Masukkan judul paket wisata"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Durasi (hari) *
                    </label>
                    <Input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', parseFloat(e.target.value) || 0)}
                      placeholder="Contoh: 4.5"
                      className={errors.duration ? 'border-red-500' : ''}
                    />
                    {errors.duration && <p className="text-sm text-red-500 mt-1">{errors.duration}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Minimum Peserta *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.minParticipants}
                      onChange={(e) => handleInputChange('minParticipants', parseInt(e.target.value) || 0)}
                      placeholder="Contoh: 2"
                      className={errors.minParticipants ? 'border-red-500' : ''}
                    />
                    {errors.minParticipants && <p className="text-sm text-red-500 mt-1">{errors.minParticipants}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Maksimum Peserta *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.maxParticipants}
                      onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value) || 0)}
                      placeholder="Contoh: 8"
                      className={errors.maxParticipants ? 'border-red-500' : ''}
                    />
                    {errors.maxParticipants && <p className="text-sm text-red-500 mt-1">{errors.maxParticipants}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Free Pax
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.freePax}
                      onChange={(e) => handleInputChange('freePax', parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Harga Paket (Rp) *
                    </label>
                    <Input
                      type="text"
                      value={formData.price.toLocaleString()}
                      onChange={(e) => handlePriceChange('price', e.target.value)}
                      placeholder="2,500,000"
                      className={errors.price ? 'border-red-500' : ''}
                    />
                    {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price}</p>}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Harga Asli (Rp)
                    </label>
                    <Input
                      type="text"
                      value={formData.originalPrice.toLocaleString()}
                      onChange={(e) => handlePriceChange('originalPrice', e.target.value)}
                      placeholder="3,000,000"
                    />
                  </div>
                </div>

              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Jenis Paket
                  </label>
                  <Select value={formData.packageType} onValueChange={(value) => handleInputChange('packageType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overland">Overland</SelectItem>
                      <SelectItem value="citytour">Citytour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Lokasi Pickup
                  </label>
                  <Input
                    value={formData.pickupLocation}
                    onChange={(e) => handleInputChange('pickupLocation', e.target.value)}
                    placeholder="Masukkan lokasi pickup"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Coverage Area
                  </label>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Masukkan area coverage"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.target as HTMLInputElement;
                            addToMultiSelect('coverageArea', input.value);
                            input.value = '';
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Masukkan area coverage"]') as HTMLInputElement;
                          if (input) {
                            addToMultiSelect('coverageArea', input.value);
                            input.value = '';
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.coverageArea.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.coverageArea.map((area, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                            <span>{area}</span>
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeFromMultiSelect('coverageArea', area)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    Destinasi
                  </label>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Masukkan destinasi"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const input = e.target as HTMLInputElement;
                            addToMultiSelect('destinations', input.value);
                            input.value = '';
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Masukkan destinasi"]') as HTMLInputElement;
                          if (input) {
                            addToMultiSelect('destinations', input.value);
                            input.value = '';
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.destinations.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.destinations.map((destination, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                            <span>{destination}</span>
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeFromMultiSelect('destinations', destination)}
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
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => executeCommand('justifyLeft')}
                    title="Align Left"
                  >
                    <span className="text-gray-700 dark:text-gray-300">⬅</span>
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => executeCommand('justifyCenter')}
                    title="Align Center"
                  >
                    <span className="text-gray-700 dark:text-gray-300">C</span>
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => executeCommand('justifyRight')}
                    title="Align Right"
                  >
                    <span className="text-gray-700 dark:text-gray-300">R</span>
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => executeCommand('justifyFull')}
                    title="Justify"
                  >
                    <span className="text-gray-700 dark:text-gray-300">J</span>
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => {
                      const url = prompt('Masukkan URL:');
                      if (url) executeCommand('createLink', url);
                    }}
                    title="Insert Link"
                  >
                    <span className="text-gray-700 dark:text-gray-300">🔗</span>
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
                  data-placeholder="Deskripsikan paket wisata secara detail..."
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

        {/* Itinerary - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Itinerary</span>
              <Button type="button" variant="outline" size="sm" onClick={addItineraryDay}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Hari
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData.itinerary.map((day, dayIndex) => (
                <div key={dayIndex} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Hari {day.day}
                    </h4>
                    {formData.itinerary.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItineraryDay(dayIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {day.activities.map((activity, activityIndex) => (
                      <div key={activityIndex} className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2 w-40">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <Input
                            type="time"
                            value={(activity as { time: string; description: string }).time || '08:00'}
                            onChange={(e) => updateItineraryTime(dayIndex, activityIndex, e.target.value)}
                            className="w-24"
                          />
                        </div>
                        <Input
                          value={(activity as { time: string; description: string }).description || ''}
                          onChange={(e) => updateActivity(dayIndex, activityIndex, e.target.value)}
                          placeholder="Masukkan aktivitas"
                          className="flex-1"
                        />
                        {day.activities.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeActivity(dayIndex, activityIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addActivity(dayIndex)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Aktivitas
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      Nama Addon
                    </label>
                    <Input
                      value={addon.name}
                      onChange={(e) => updateAddon(index, 'name', e.target.value)}
                      placeholder="Contoh: Asuransi Perjalanan"
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
              onClick={() => navigate('/dashboard/services/packages')}
            >
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              {isEdit ? 'Update Paket' : 'Simpan Paket'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
