import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Alamat Kantor',
      details: [
        'Jl. Sudirman Kav. 45',
        'Jakarta Pusat 10210',
        'Indonesia'
      ]
    },
    {
      icon: Phone,
      title: 'Telefon',
      details: [
        '+62 21 1234 5678',
        '+62 21 8765 4321',
        'WhatsApp: +62 812 3456 7890'
      ]
    },
    {
      icon: Mail,
      title: 'Email',
      details: [
        'info@TraveGO.com',
        'booking@TraveGO.com',
        'support@TraveGO.com'
      ]
    },
    {
      icon: Clock,
      title: 'Jam Operasional',
      details: [
        'Senin - Jumat: 08:00 - 18:00',
        'Sabtu: 08:00 - 16:00',
        'Minggu: 09:00 - 15:00'
      ]
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      service: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission logic here
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section with Parallax Background */}
      <section className="relative h-80 w-full text-white overflow-hidden">
        {/* Background Image dengan Parallax Effect */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage: 'url(https://cdn.paradisotour.co.id/wp-content/uploads/2024/01/Kelebihan-Mobil-Hiace.jpg)'
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="relative h-full flex items-center justify-center px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Hubungi Kami</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Kami siap membantu Anda merencanakan perjalanan impian. 
              Hubungi tim profesional kami untuk konsultasi dan booking
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Informasi Kontak
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  Jangan ragu untuk menghubungi kami. Tim customer service kami 
                  siap membantu Anda 24/7 untuk semua kebutuhan perjalanan.
                </p>
              </div>

              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <Card key={index} className="bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                          <info.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            {info.title}
                          </h3>
                          <div className="space-y-1">
                            {info.details.map((detail, idx) => (
                              <p key={idx} className="text-gray-600 dark:text-gray-300 text-sm">
                                {detail}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Aksi Cepat
                </h3>
                <div className="flex flex-col space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Phone className="mr-2 h-4 w-4" />
                    Call Center: 1500-888
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    WhatsApp: +62 812 3456 7890
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white dark:bg-gray-800 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900 dark:text-white">
                  Kirim Pesan
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-300">
                  Isi form di bawah ini dan kami akan merespon dalam 1x24 jam
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nama Lengkap *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        placeholder="Masukkan nama lengkap"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="contoh@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nomor Telefon *
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        placeholder="+62 812 3456 7890"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="service" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Layanan yang Diminati
                      </label>
                      <Select value={formData.service} onValueChange={handleServiceChange}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Pilih layanan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rental">Rental Mobil</SelectItem>
                          <SelectItem value="travel">Travel Antar Kota</SelectItem>
                          <SelectItem value="paket">Paket Wisata</SelectItem>
                          <SelectItem value="airport">Airport Transfer</SelectItem>
                          <SelectItem value="other">Lainnya</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Pesan *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      placeholder="Tulis pesan Anda di sini..."
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button type="submit" className="flex-1 h-12">
                      <Send className="mr-2 h-4 w-4" />
                      Kirim Pesan
                    </Button>
                    <Button type="button" variant="outline" className="h-12">
                      Reset Form
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Map Section */}
            <Card className="mt-8 bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 dark:text-white">
                  Lokasi Kantor
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <MapPin className="h-12 w-12 mx-auto mb-4" />
                      <p className="text-lg font-medium">Peta Interaktif</p>
                      <p className="text-sm">Jl. Sudirman Kav. 45, Jakarta Pusat</p>
                      <Button className="mt-4" variant="outline" size="sm">
                        Buka di Google Maps
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};