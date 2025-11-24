import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface InquirySectionProps {
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
}

export const InquirySection: React.FC<InquirySectionProps> = ({
  title = "Belum menemukan yang sesuai?",
  subtitle = "Tenang, hubungi kami untuk mendapatkan penawaran yang sesuai dengan permintaanmu",
  backgroundImage = "https://cdn.paradisotour.co.id/wp-content/uploads/2024/01/Kelebihan-Mobil-Hiace.jpg"
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    requirement: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Inquiry form submitted:', formData);
    // Handle form submission logic here
  };

  return (
    <section className="relative py-16 text-white overflow-hidden">
      {/* Background Image dengan Parallax Effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{
          backgroundImage: `url(${backgroundImage})`
        }}
      />
      {/* Overlay untuk meningkatkan readability */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold mb-4">
          {title}
        </h2>
        <p className="text-xl mb-8 text-blue-100">
          {subtitle}
        </p>
        
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Horizontal Input Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="inquiryName" className="text-sm font-medium text-white">
                  Nama Lengkap *
                </label>
                <Input
                  id="inquiryName"
                  name="name"
                  type="text"
                  placeholder="Masukkan nama lengkap Anda"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full placeholder:text-gray-500"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="inquiryEmail" className="text-sm font-medium text-white">
                  Email *
                </label>
                <Input
                  id="inquiryEmail"
                  name="email"
                  type="email"
                  placeholder="contoh@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full placeholder:text-gray-500"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="inquiryPhone" className="text-sm font-medium text-white">
                  Nomor Telepon *
                </label>
                <Input
                  id="inquiryPhone"
                  name="phone"
                  type="tel"
                  placeholder="08xxxxxxxxxx"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full placeholder:text-gray-500"
                  required
                />
              </div>
            </div>
            
            {/* Textarea Row */}
            <div className="space-y-2">
              <label htmlFor="inquiryRequirement" className="text-sm font-medium text-white">
                Kebutuhan/Keperluan *
              </label>
              <Textarea
                id="inquiryRequirement"
                name="requirement"
                placeholder="Jelaskan kebutuhan atau keperluan Anda secara detail..."
                value={formData.requirement}
                onChange={handleInputChange}
                className="w-full min-h-[100px] placeholder:text-gray-500"
                required
              />
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-center">
              <Button type="submit" className="bg-white hover:bg-gray-100 text-gray-800 px-8 py-3">
                Kirim Permintaan
              </Button>
            </div>
            
            <p className="text-xs text-blue-100 text-center">
              Dengan mengirim permintaan, Anda menyetujui syarat dan ketentuan yang berlaku
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};
