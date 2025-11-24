import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Star, Share2, Heart, Search, ChevronLeft, Users, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ImagePopup } from '@/components/common/ImagePopup';

// Sample data - in real app, this would come from API
const sampleData = {
  id: 1,
  name: "Toyota Hiace Premio",
  type: "Minibus",
  capacity: "12-15 orang",
  year: "2023",
  transmission: "Manual",
  fuel: "Diesel",
  price: "Rp 800.000",
  originalPrice: "Rp 1.000.000",
  rating: 4.8,
  reviews: 24,
  images: [
    "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop"
  ],
  description: `
    Toyota Hiace Premio adalah pilihan terbaik untuk perjalanan grup dengan kapasitas 12-15 orang. Dilengkapi dengan fitur-fitur modern dan kenyamanan maksimal untuk perjalanan jarak jauh.

    **Spesifikasi Teknis:**
    - Mesin: 2.8L Turbo Diesel
    - Transmisi: Manual 5-speed
    - Kapasitas Bahan Bakar: 70 liter
    - Dimensi: 5,265 x 1,950 x 2,280 mm
    - Ground Clearance: 190 mm
    - Berat Kosong: 2,200 kg

    **Fitur Interior:**
    - 15 kursi empuk dengan headrest
    - AC dengan 4 blower
    - Audio system dengan Bluetooth
    - Charging port USB di setiap kursi
    - Bagasi besar untuk koper dan barang
    - Jendela besar untuk pemandangan
    - Lantai karpet premium

    **Fitur Keamanan:**
    - ABS (Anti-lock Braking System)
    - EBD (Electronic Brake Distribution)
    - Dual Airbag untuk pengemudi dan penumpang depan
    - Seatbelt 3-point untuk semua penumpang
    - Central lock dengan remote
    - Alarm system
    - Immobilizer

    **Fitur Eksterior:**
    - Body warna solid dengan cat premium
    - Bumper depan dan belakang
    - Spion elektrik dengan defogger
    - Lampu LED untuk efisiensi energi
    - Ban tubeless dengan velg alloy
    - Kaca film untuk privasi dan kenyamanan

    **Sesuai untuk:**
    - Tour grup keluarga
    - Perjalanan bisnis
    - Event perusahaan
    - Wisata religi
    - Perjalanan antar kota
    - Airport transfer

    **Driver & Service:**
    - Driver berpengalaman dan profesional
    - Berpakaian rapi dan sopan
    - Menguasai rute dengan baik
    - Siap membantu dengan barang bawaan
    - Tersedia 24/7 untuk kebutuhan darurat

    **Termasuk dalam harga:**
    - Bahan bakar untuk perjalanan
    - Driver profesional
    - Parkir dan tol
    - Air mineral untuk penumpang
    - Tissue dan sanitizer
    - First aid kit
  `,
  features: [
    "AC",
    "Audio System",
    "Kursi empuk",
    "Driver berpengalaman",
    "Bahan bakar",
    "Parkir tol"
  ],
  specifications: [
    "Mesin: 2.8L Turbo Diesel",
    "Transmisi: Manual 5-speed",
    "Kapasitas: 12-15 orang",
    "Tahun: 2023",
    "Bahan Bakar: Diesel",
    "AC: 4 blower"
  ],
  amenities: [
    "Charging port USB",
    "Audio Bluetooth",
    "Bagasi besar",
    "Jendela besar",
    "Karpet premium",
    "Air mineral"
  ]
};

export const ArmadaDetail: React.FC = () => {
  const navigate = useNavigate();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);

  // In real app, fetch data based on id from useParams
  const data = sampleData;

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  const handleImageChange = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleOrderNow = () => {
    navigate(`/checkout/armada/${data.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner with Blue Tosca Background */}
      <section className="relative h-96 w-full text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600"
          style={{
            background: 'linear-gradient(135deg, #20B2AA 0%, #008B8B 50%, #006666 100%)'
          }}
        />
        <div className="absolute inset-0 bg-black/20" />
        
        <div className="relative h-full flex items-center justify-center px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="max-w-4xl w-full">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="!w-auto !h-auto p-2 mb-6 bg-transparent text-white hover:bg-white/20"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            {/* Title */}
            <h1 className="text-4xl font-bold mb-4 text-white">
              {data.name}
            </h1>

            {/* Vehicle Info */}
            <div className="flex items-center mb-4">
              <Car className="h-5 w-5 mr-2 text-white" />
              <span className="text-white mr-4">{data.type} • {data.capacity}</span>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {data.year}
              </Badge>
            </div>

            {/* Vehicle Details */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-white" />
                <span className="text-white">Kapasitas: {data.capacity}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-white" />
                <span className="text-white">Tahun: {data.year}</span>
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-white" />
                <span className="text-white">Rating: {data.rating} ({data.reviews} ulasan)</span>
              </div>
            </div>
          </div>

          {/* Action Icons */}
          <div className="absolute top-6 right-6 flex space-x-3">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Image Gallery Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Image */}
            <div className="lg:col-span-3">
              <div className="relative h-96 rounded-lg overflow-hidden cursor-pointer group" onClick={() => handleImageClick(0)}>
                <img
                  src={data.images[0]}
                  alt={data.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>
            </div>

            {/* Thumbnail Grid */}
            <div className="lg:col-span-1">
              <div className="grid grid-cols-2 gap-3">
                {data.images.slice(1, 5).map((image, index) => (
                  <div
                    key={index + 1}
                    className="relative h-24 rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => handleImageClick(index + 1)}
                  >
                    <img
                      src={image}
                      alt={`Gallery ${index + 2}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  </div>
                ))}
                
                {/* See All Photos Button */}
                <div
                  className="relative h-24 rounded-lg overflow-hidden cursor-pointer group bg-gray-200 flex items-center justify-center"
                  onClick={() => handleImageClick(0)}
                >
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-2 bg-white/80 rounded-full flex items-center justify-center">
                      <Search className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-sm text-gray-600 font-medium">See All Photos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Description Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Deskripsi Armada</h2>
              
              <div className="prose prose-lg max-w-none">
                {data.description.split('\n').map((paragraph, index) => {
                  if (paragraph.trim() === '') return <br key={index} />;
                  
                  if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                    return (
                      <h3 key={index} className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                        {paragraph.replace(/\*\*/g, '')}
                      </h3>
                    );
                  }
                  
                  if (paragraph.startsWith('- ')) {
                    return (
                      <p key={index} className="text-gray-700 mb-2 ml-4">
                        {paragraph}
                      </p>
                    );
                  }
                  
                  return (
                    <p key={index} className="text-gray-700 mb-4 leading-relaxed">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                {/* Rating */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                  <div className="flex items-center mb-4">
                    <Star className="h-6 w-6 text-yellow-400 fill-current mr-2" />
                    <span className="text-2xl font-bold text-gray-900">{data.rating}/5</span>
                    <span className="text-sm text-gray-500 ml-2">(From {data.reviews} Reviews)</span>
                  </div>
                  
                  {/* Price */}
                  <div className="mb-6">
                    <div className="text-sm text-gray-500 line-through mb-1">
                      {data.originalPrice}
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      {data.price}
                    </div>
                    <div className="text-sm text-gray-500">/hari</div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      onClick={handleOrderNow}
                    >
                      Pesan Sekarang
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(`/custom-order/armada/${data.id}`)}
                    >
                      Ajukan custom order
                    </Button>
                  </div>
                </div>

                {/* Specifications */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Spesifikasi</h3>
                  <ul className="space-y-2">
                    {data.specifications.map((spec, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-700">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        {spec}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Features */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Fasilitas</h3>
                  <ul className="space-y-2">
                    {data.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Amenities */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Fasilitas Tambahan</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.amenities.map((amenity, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Ulasan Terbaru</h2>
              
              {/* Write Review Form */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tulis Ulasan Anda</h3>
                
                {/* Rating Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rating
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setSelectedRating(rating)}
                        className="focus:outline-none bg-transparent p-1 rounded"
                      >
                        <Star
                          className={`h-6 w-6 transition-colors ${
                            rating <= selectedRating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300 dark:hover:text-yellow-500'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Review Text */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ulasan Anda
                  </label>
                  <Textarea
                    placeholder="Bagikan pengalaman Anda menggunakan layanan ini..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                
                {/* Submit Button */}
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={!selectedRating || !reviewText.trim()}
                >
                  Kirim Ulasan
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* Review 1 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg font-medium mr-4 flex-shrink-0">
                      B
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Budi Santoso</h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">3 hari yang lalu</span>
                      </div>
                      <div className="flex items-center mb-3">
                        <div className="flex text-yellow-400 mr-2">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className="text-sm">★</span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">5.0</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        "Armada Hiace Premio ini sangat nyaman untuk perjalanan grup. AC dingin, kursi empuk, dan driver sangat profesional. Cocok untuk perjalanan jarak jauh. Recommended banget!"
                      </p>
                    </div>
                  </div>
                  
                  {/* Review Images */}
                  <div className="flex space-x-2 mt-4">
                    <img
                      src="https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=100&h=100&fit=crop"
                      alt="Review photo 1"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop"
                      alt="Review photo 2"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </div>
                </div>

                {/* Review 2 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start mb-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-lg font-medium mr-4 flex-shrink-0">
                      M
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Maya Sari</h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">1 minggu yang lalu</span>
                      </div>
                      <div className="flex items-center mb-3">
                        <div className="flex text-yellow-400 mr-2">
                          {[...Array(4)].map((_, i) => (
                            <span key={i} className="text-sm">★</span>
                          ))}
                          <span className="text-sm text-gray-300">★</span>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">4.0</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        "Kendaraan bersih dan terawat dengan baik. Driver ramah dan menguasai rute. Harga sesuai dengan kualitas pelayanan. Akan menggunakan lagi untuk perjalanan berikutnya."
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* View All Reviews Button */}
              <div className="text-center mt-8">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="px-8"
                  onClick={() => navigate(`/reviews/armada/${data.id}`)}
                >
                  Lihat Semua Ulasan ({data.reviews})
                </Button>
              </div>
            </div>

            {/* Sidebar - Rating Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                {/* Overall Rating */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rating Keseluruhan</h3>
                  
                  <div className="text-center mb-4">
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{data.rating}</div>
                    <div className="flex justify-center text-yellow-400 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-lg ${i < Math.floor(data.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Berdasarkan {data.reviews} ulasan</p>
                  </div>

                  {/* Rating Breakdown */}
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-300 w-8">{rating}</span>
                        <span className="text-yellow-400 text-sm mr-2">★</span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mx-2">
                          <div 
                            className="bg-yellow-400 h-2 rounded-full" 
                            style={{ width: `${rating === 5 ? 80 : rating === 4 ? 15 : rating === 3 ? 5 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300 w-8">
                          {rating === 5 ? '19' : rating === 4 ? '4' : rating === 3 ? '1' : '0'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Write Review Button */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bagikan Pengalaman Anda</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Sudah pernah menggunakan layanan ini? Bagikan pengalaman Anda kepada calon pelanggan lainnya.
                  </p>
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                    Tulis Ulasan
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Image Popup */}
      <ImagePopup
        images={data.images}
        currentIndex={selectedImageIndex}
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        onImageChange={handleImageChange}
        itemType="armada"
        itemId={data.id.toString()}
      />
    </div>
  );
};
