import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

export const Pricing: React.FC = () => {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Pricing
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Pilih paket yang sesuai dengan kebutuhan bisnis Anda
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                  >
                    Pilih Paket
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

