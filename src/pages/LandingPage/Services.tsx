import React from 'react';
import { Car, Plane, MapPin, Users, Shield, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const Services: React.FC = () => {
  const services = [
    {
      icon: Car,
      title: 'Rental Mobil',
      description: 'Layanan penyewaan mobil dengan berbagai pilihan kelas dan tipe kendaraan',
      features: [
        'Mobil terawat dan berkualitas',
        'Driver berpengalaman (opsional)',
        'Asuransi perjalanan',
        'BBM termasuk (paket tertentu)',
        'GPS dan emergency kit',
        'Support 24/7'
      ],
      priceRange: 'Rp 200.000 - Rp 800.000/hari',
      popular: true
    },
    {
      icon: Users,
      title: 'Travel Antar Kota',
      description: 'Layanan transportasi antar kota dengan kenyamanan dan keamanan terjamin',
      features: [
        'Armada bus dan travel bersih',
        'AC dan entertainment system',
        'Jadwal keberangkatan fleksibel',
        'Pick up point strategis',
        'Snack dan refreshment',
        'Asuransi perjalanan'
      ],
      priceRange: 'Rp 75.000 - Rp 300.000',
      popular: true
    },
    {
      icon: MapPin,
      title: 'Paket Wisata',
      description: 'Paket tour lengkap dengan destinasi menarik dan pengalaman tak terlupakan',
      features: [
        'Destinasi wisata populer',
        'Hotel berbintang',
        'Tour guide profesional',
        'Transportasi AC',
        'Meal plan lengkap',
        'Dokumentasi foto/video'
      ],
      priceRange: 'Rp 500.000 - Rp 5.000.000',
      popular: false
    },
    {
      icon: Plane,
      title: 'Airport Transfer',
      description: 'Layanan antar jemput bandara dengan punktualitas dan kenyamanan tinggi',
      features: [
        'Monitoring flight schedule',
        'Meet & greet service',
        'Kendaraan premium',
        'Professional driver',
        'Baggage assistance',
        'Fixed rate pricing'
      ],
      priceRange: 'Rp 150.000 - Rp 400.000',
      popular: false
    }
  ];

  const whyChooseUs = [
    {
      icon: Shield,
      title: 'Berlisensi & Terpercaya',
      description: 'Semua layanan telah memiliki izin resmi dan asuransi yang lengkap'
    },
    {
      icon: Clock,
      title: 'Tepat Waktu',
      description: 'Komitmen tinggi terhadap ketepatan waktu dan jadwal yang telah disepakati'
    },
    {
      icon: Users,
      title: 'Tim Professional',
      description: 'Driver dan tour guide berpengalaman dengan sertifikasi resmi'
    }
  ];

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
            <h1 className="text-4xl font-bold mb-4">Layanan Kami</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Menyediakan berbagai layanan transportasi dan wisata dengan standar kualitas tinggi 
              untuk memenuhi semua kebutuhan perjalanan Anda
            </p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white dark:bg-gray-800">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <service.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {service.title}
                        </h3>
                        {service.popular && (
                          <Badge className="bg-red-500 hover:bg-red-500 text-white">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        {service.description}
                      </p>
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Fitur Layanan:
                        </h4>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {service.features.map((feature, idx) => (
                            <li key={idx} className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                              <div className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full mr-2" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {service.priceRange}
                        </span>
                        <Badge variant="outline" className="border-blue-200 text-blue-700 dark:border-blue-700 dark:text-blue-300">
                          Starting Price
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Mengapa Memilih Layanan Kami?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Komitmen kami adalah memberikan pengalaman perjalanan terbaik dengan standar layanan profesional
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {whyChooseUs.map((item, index) => (
              <div key={index} className="text-center group">
                <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 dark:bg-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Siap Memesan Layanan Kami?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Hubungi tim kami sekarang untuk mendapatkan penawaran terbaik dan konsultasi gratis
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+62211234567"
              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Users className="mr-2 h-5 w-5" />
              Hubungi Kami
            </a>
            <a
              href="/contact"
              className="inline-flex items-center px-6 py-3 border border-white text-white font-medium rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              <MapPin className="mr-2 h-5 w-5" />
              Kunjungi Kantor
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};