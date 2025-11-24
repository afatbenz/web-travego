import React, { useState } from 'react';
import { Star, Shield, Clock, Headphones, ArrowRight, Phone, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({});

  const toggleExpand = (planName: string) => {
    setExpandedPlans(prev => ({
      ...prev,
      [planName]: !prev[planName]
    }));
  };

  const pricingPlans = [
    {
      name: 'Basic',
      sixMonthPrice: 'Rp 425.000',
      yearlyPrice: 'Rp 750.000',
      popular: false,
      features: [
        'Support 24/7',
        'Sharing hosting ERP',
        'Team Management and Scheduling',
        'Fleet Management',
        'Catalogue',
        '2 account 1 company'
      ]
    },
    {
      name: 'Standar',
      sixMonthPrice: 'Rp 1.250.000',
      yearlyPrice: 'Rp 2.200.000',
      popular: true,
      features: [
        'Support 24/7',
        'Sharing hosting ERP',
        'Sharing memory',
        'Dedicated Hosting Website',
        'Team Management and Scheduling',
        'Fleet Management',
        'Catalogue',
        'Finance Report',
        '5 account',
        'Whatsapp AI Sales Assistant',
        '200 chat/day'
      ]
    },
    {
      name: 'Platinum',
      sixMonthPrice: 'Rp 2.250.000',
      yearlyPrice: 'Rp 4.000.000',
      popular: false,
      features: [
        'Support 24/7',
        'Dedicated hosting ERP',
        'Dedicated Memory up to 100GB',
        'Dedicated Hosting Website',
        'Team Management and Scheduling',
        'Fleet Management',
        'Catalogue',
        'Finance Report',
        'Unlimited account',
        'Whatsapp AI Sales Assistant',
        '500 chat/day',
        'Customer Relationship Program',
        'Loyalty Program'
      ]
    }
  ];

  const whyChooseUs = [
    {
      icon: Shield,
      title: 'Amanah & Professional',
      description: 'Komitmen profesional dengan integritas tinggi dalam setiap layanan yang kami berikan.'
    },
    {
      icon: Clock,
      title: 'Pelayanan 24/7',
      description: 'Tim customer service yang dibantu dengan teknologi AI siap melayani Anda kapan saja.'
    },
    {
      icon: Star,
      title: 'End-To-End Service',
      description: 'Memudahkan pengaturan bisnis anda dengan efisien'
    },
    {
      icon: Headphones,
      title: 'Support Lengkap',
      description: 'Dukungan penuh dari booking hingga perjalanan selesai dengan teknologi AI.'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section with Background Image */}
      <section className="relative h-screen w-full text-white overflow-hidden">
        {/* Background Image dengan Parallax Effect */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage: 'url(https://cdn.paradisotour.co.id/wp-content/uploads/2024/01/Kelebihan-Mobil-Hiace.jpg)'
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="relative h-full flex flex-col justify-between px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8 sm:py-12">
          {/* Title and Subtitle - Top Section */}
          <div className="text-center pt-24 sm:pt-32 md:pt-40 lg:pt-48">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              Jelajahi Indonesia Bersama Kami
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed px-4">
              Solusi terpercaya untuk semua kebutuhan perjalanan Anda. 
              Dari rental mobil hingga paket wisata lengkap.
            </p>
          </div>

        </div>
      </section>


      {/* Why Choose Us Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Kenapa Pilih TraveGO?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Kami berkomitmen memberikan layanan terbaik dengan standar internasional
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUs.map((item, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <item.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-16 bg-white dark:bg-gray-950">
        <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Pricing
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Pilih paket yang sesuai dengan kebutuhan bisnis Anda
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <Card 
                key={plan.name}
                className={`group overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col relative ${
                  plan.popular 
                    ? 'border-2 border-blue-600 dark:border-blue-400' 
                    : 'hover:border-2 hover:border-orange-500 dark:hover:border-orange-400'
                }`}
              >
                <CardContent className="p-6 flex flex-col h-full">
                  {plan.popular && (
                    <Badge className="absolute top-4 right-4 bg-blue-600 hover:bg-blue-600 text-white z-10">
                      Paling Populer
                    </Badge>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <div className="border-t border-gray-200 dark:border-gray-700 mb-4"></div>
                  </div>
                  
                  <div className="mb-6 flex-1">
                    <div className="text-center mb-6">
                      <div className="text-3xl font-bold text-orange-500 dark:text-orange-400 mb-1">
                        {plan.sixMonthPrice}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        /6 bulan
                      </div>
                      <div className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-2">
                        atau
                      </div>
                      <div className="text-2xl font-bold text-cyan-500 dark:text-cyan-400 mt-1">
                        {plan.yearlyPrice}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        /tahun
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Fitur:</h4>
                      {(expandedPlans[plan.name] ? plan.features : plan.features.slice(0, 4)).map((feature, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <Check className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                        </div>
                      ))}
                      {plan.features.length > 4 && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(plan.name)}
                          className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium mt-2 w-full justify-center pt-2 bg-transparent hover:bg-transparent"
                        >
                          <span>{expandedPlans[plan.name] ? 'Tutup' : 'Lihat Semua Fitur'}</span>
                          {expandedPlans[plan.name] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="border-t border-gray-200 dark:border-gray-700 mb-4"></div>
                    <Button className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}>
                      Pilih Paket
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Inquiry Section */}
      <section className="relative py-16 text-white overflow-hidden">
        {/* Background Image dengan Parallax Effect */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
          style={{
            backgroundImage: 'url(https://baze.co.id/wp-content/uploads/2021/03/PREMIO-CR1-1.jpg)'
          }}
        />
        {/* Overlay untuk meningkatkan readability */}
        <div className="absolute inset-0 bg-black/60" />
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Siap Memulai Perjalanan Anda?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Hubungi tim kami untuk konsultasi gratis dan penawaran terbaik
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              className="bg-white text-blue-600 hover:bg-blue-50"
              onClick={() => navigate('/contact')}
            >
              <Phone className="mr-2 h-5 w-5" />
              Hubungi Kami
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white bg-white/10 hover:bg-white hover:text-blue-600"
              onClick={() => navigate('/catalog')}
            >
              Lihat Katalog
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};