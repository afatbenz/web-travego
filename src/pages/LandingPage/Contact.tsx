import React, { useState } from 'react';
import { MapPin, Mail, Send, MessageCircle, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export const Contact: React.FC = () => {
  const topics = ['Demo produk', 'Pertanyaan harga', 'Bantuan teknis', 'Kerja sama', 'Lainnya'] as const;
  const [selectedTopic, setSelectedTopic] = useState<(typeof topics)[number]>('Demo produk');
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    email: '',
    whatsapp: '',
    businessScale: '',
    message: ''
  });

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
      businessScale: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission logic here
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#03102b] via-[#0a2458] to-[#040d22] px-4 pt-20 pb-12 sm:px-6 sm:pb-16 lg:px-8 xl:px-12 2xl:px-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 left-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-400/20 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl text-center">
          <h1 className="text-sm font-semibold tracking-wide text-blue-100/90 mt-8"></h1>
          <div className="mt-4 flex justify-center">
            <Badge className="rounded-xl border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-blue-100 shadow-sm backdrop-blur-md">
              Kami siap membantu
            </Badge>
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">Hubungi tim Travego</h2>
          <p className="mt-4 text-lg leading-relaxed text-blue-100/90">
            Ada pertanyaan soal produk, butuh demo, atau ingin migrasi dari sistem lama? Tim kami siap merespons dalam
            waktu kurang dari 2 jam.
          </p>
        </div>
      </section>

      <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <div className="space-y-6">
            <div>
              <Badge className="rounded-full bg-blue-600 hover:bg-blue-600 text-white px-4 py-1.5">
                Kami siap membantu
              </Badge>
              <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Hubungi tim Travego</h2>
              <p className="mt-2 text-gray-600 dark:text-gray-300 leading-relaxed">
                Ada pertanyaan soal produk, butuh demo, atau ingin migrasi dari sistem lama? Tim kami siap merespons dalam
                waktu kurang dari 2 jam.
              </p>
            </div>

            <Card className="bg-white dark:bg-gray-800 shadow-sm">
              <CardContent className="p-6">
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/20 rounded-xl flex items-center justify-center">
                      <MessageCircle className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">WhatsApp</h3>
                        <Badge className="bg-green-500 hover:bg-green-500 text-white text-xs">Online sekarang</Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        Respons tercepat untuk pertanyaan umum
                      </p>
                      <a href="https://wa.me/62812" className="inline-flex mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                        +62 812-xxxx-xxxx
                      </a>
                    </div>
                  </div>

                  <div className="h-px bg-gray-200 dark:bg-gray-700"></div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                      <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Email</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Untuk pertanyaan teknis & kerja sama</p>
                      <a href="mailto:solutions@travego.id" className="inline-flex mt-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                        solutions@travego.id
                      </a>
                    </div>
                  </div>

                  <div className="h-px bg-gray-200 dark:bg-gray-700"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 shadow-sm">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Senin – Jumat</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">08.00 – 21.00 WIB</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Sabtu – Minggu</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">09.00 – 17.00 WIB</div>
                  </div>
                </div>

                <div className="my-5 h-px bg-gray-200 dark:bg-gray-700"></div>

                <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>Jl. P. Jolang III, Purbayan, Kotagede, Kota Yogyakarta, D.I. Yogyakarta</div>
                </div>

                <div className="mt-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4">
                  <a href="https://maps.app.goo.gl/dw74PDGAdKAjdbrT9" className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                    <Map className="h-4 w-4" />
                    Lihat di Google Maps
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-white dark:bg-gray-800 shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900 dark:text-white">Kirim pesan ke kami</CardTitle>
                <p className="text-gray-600 dark:text-gray-300">Isi form di bawah dan kami akan menghubungi Anda segera.</p>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {topics.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => setSelectedTopic(topic)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                          selectedTopic === topic
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nama lengkap *
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
                      <label htmlFor="businessName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nama bisnis
                      </label>
                      <Input
                        id="businessName"
                        name="businessName"
                        type="text"
                        placeholder="Contoh: Travego Tour"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="nama@bisnis.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="whatsapp" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nomor WhatsApp *
                      </label>
                      <Input
                        id="whatsapp"
                        name="whatsapp"
                        type="tel"
                        required
                        placeholder="+62 812 3456 7890"
                        value={formData.whatsapp}
                        onChange={handleInputChange}
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="businessScale" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Skala bisnis
                    </label>
                    <Select value={formData.businessScale} onValueChange={handleServiceChange}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Pilih skala bisnis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-5">1–5 kendaraan/agen</SelectItem>
                        <SelectItem value="6-20">6–20</SelectItem>
                        <SelectItem value="21-50">21–50</SelectItem>
                        <SelectItem value="50plus">50+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Pesan *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      placeholder="Ceritakan kebutuhan bisnis Anda, kami akan siapkan solusi yang tepat..."
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white">
                    <Send className="mr-2 h-4 w-4" />
                    Kirim Pesan
                  </Button>

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Dengan mengirim form ini Anda menyetujui kebijakan privasi Travego.
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
