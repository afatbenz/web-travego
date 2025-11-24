import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImagePopup } from '@/components/common/ImagePopup';
import { DetailBanner } from '@/components/common/DetailBanner';
import { ReviewForm } from '@/components/common/ReviewForm';

// Sample data - in real app, this would come from API
const sampleData = {
  id: 1,
  title: "Thailand Bangkok Tour Package - 4 Days 3 Nights",
  location: "111/78 Pattarin, Bangchan, Klongsamwa, Bangkok, Thailand 10510",
  nearestDate: "Sat, 04 Oct 2025",
  duration: "4 Days",
  rating: 10.0,
  reviewCount: 2,
  price: "Rp 2.500.000",
  originalPrice: "Rp 3.000.000",
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
    Nikmati pengalaman wisata yang tak terlupakan di Bangkok, Thailand dengan paket tour 4 hari 3 malam yang telah dirancang khusus untuk memberikan Anda pengalaman terbaik. 

    **Hari 1: Kedatangan & City Tour**
    - Tiba di Bandara Suvarnabhumi Bangkok
    - Transfer ke hotel dan check-in
    - City tour mengunjungi Grand Palace dan Wat Phra Kaew
    - Makan siang di restoran lokal
    - Mengunjungi Wat Pho (Temple of the Reclining Buddha)
    - Shopping di Chatuchak Weekend Market
    - Makan malam di restoran tradisional Thailand

    **Hari 2: Floating Market & Cultural Experience**
    - Sarapan di hotel
    - Mengunjungi Damnoen Saduak Floating Market
    - Naik perahu tradisional dan berbelanja di pasar terapung
    - Mengunjungi Rose Garden untuk pertunjukan budaya Thailand
    - Makan siang dengan masakan Thailand autentik
    - Kembali ke Bangkok dan waktu bebas
    - Makan malam di rooftop restaurant dengan pemandangan kota

    **Hari 3: Temples & Modern Bangkok**
    - Sarapan di hotel
    - Mengunjungi Wat Arun (Temple of Dawn)
    - Naik perahu menyusuri Sungai Chao Phraya
    - Mengunjungi Wat Saket (Golden Mount)
    - Makan siang di Chinatown
    - Shopping di MBK Center dan Siam Paragon
    - Menikmati pemandangan sunset dari Sky Bar
    - Makan malam di restoran mewah

    **Hari 4: Departure**
    - Sarapan di hotel
    - Check-out dari hotel
    - Transfer ke bandara
    - Berangkat ke kota asal

    **Included:**
    - 3 malam akomodasi di hotel bintang 4
    - Transportasi AC selama tour
    - Makan sesuai itinerary (3x breakfast, 3x lunch, 3x dinner)
    - Tiket masuk ke semua tempat wisata
    - Guide berbahasa Indonesia
    - Airport transfer

    **Excluded:**
    - Tiket pesawat internasional
    - Visa (jika diperlukan)
    - Personal expenses
    - Tips untuk guide dan driver
    - Travel insurance
  `,
  features: [
    "Hotel bintang 4",
    "Transportasi AC",
    "Guide berbahasa Indonesia",
    "Makan sesuai itinerary",
    "Tiket masuk semua tempat wisata",
    "Airport transfer"
  ],
  highlights: [
    "Grand Palace & Wat Phra Kaew",
    "Floating Market",
    "Wat Arun Temple",
    "Chatuchak Market",
    "Sky Bar Bangkok",
    "Cultural Show"
  ]
};

export const CatalogDetail: React.FC = () => {
  const navigate = useNavigate();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

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
    navigate(`/checkout/catalog/${data.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner with Blue Tosca Background */}
      <DetailBanner
        title={data.title}
        location={data.location}
        showMapButton={true}
      />

      {/* Tour Details */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-gray-600" />
              <span className="text-gray-600">Nearest Tour Date | {data.nearestDate}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-gray-600" />
              <span className="text-gray-600">Tour Duration | {data.duration}</span>
            </div>
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
                  alt={data.title}
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Deskripsi Paket</h2>
              
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
                    <span className="text-2xl font-bold text-gray-900">{data.rating}/10</span>
                    <span className="text-sm text-gray-500 ml-2">(From {data.reviewCount} Reviews)</span>
                  </div>
                  
                  {/* Price */}
                  <div className="mb-6">
                    <div className="text-sm text-gray-500 line-through mb-1">
                      {data.originalPrice}
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      {data.price}
                    </div>
                    <div className="text-sm text-gray-500">/pax</div>
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
                      onClick={() => navigate(`/custom-order/catalog/${data.id}`)}
                    >
                      Ajukan custom order
                    </Button>
                  </div>
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

                {/* Highlights */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Highlight Wisata</h3>
                  <div className="flex flex-wrap gap-2">
                    {data.highlights.map((highlight, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {highlight}
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Ulasan Terbaru</h2>
              
              {/* Write Review Form */}
              <ReviewForm
                onSubmit={(rating, review) => {
                  console.log('Review submitted:', { rating, review });
                }}
                className="mb-6"
              />
              
              <div className="space-y-6">
                {/* Review 1 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start mb-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg font-medium mr-4 flex-shrink-0">
                      A
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ahmad Rizki</h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">2 hari yang lalu</span>
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
                        "Paket tour yang sangat memuaskan! Pelayanan guide sangat baik dan tempat wisata yang dikunjungi sesuai dengan yang dijanjikan. Hotel yang disediakan juga nyaman dan lokasinya strategis. Makanan yang disajikan sangat lezat dan autentik. Transportasi selama tour juga sangat nyaman. Recommended banget untuk yang ingin liburan ke Bangkok!"
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
                    <img
                      src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=100&h=100&fit=crop"
                      alt="Review photo 3"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </div>
                </div>

                {/* Review 2 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start mb-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-lg font-medium mr-4 flex-shrink-0">
                      S
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sari Dewi</h3>
                        <span className="text-sm text-gray-500 dark:text-gray-400">1 minggu yang lalu</span>
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
                        "Pengalaman wisata yang tak terlupakan! Hotel bagus, makanan enak, dan transportasi nyaman. Worth it banget untuk harga segini. Guide-nya ramah dan informatif, bisa bahasa Indonesia dengan baik. Itinerary yang diberikan juga sangat lengkap dan tidak terburu-buru. Pasti akan booking lagi untuk destinasi lain!"
                      </p>
                    </div>
                  </div>
                  
                  {/* Review Images */}
                  <div className="flex space-x-2 mt-4">
                    <img
                      src="https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop"
                      alt="Review photo 1"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=100&h=100&fit=crop"
                      alt="Review photo 2"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* View All Reviews Button */}
              <div className="text-center mt-8">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="px-8"
                  onClick={() => navigate(`/reviews/catalog/${data.id}`)}
                >
                  Lihat Semua Ulasan (15)
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
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">10.0</div>
                    <div className="flex justify-center text-yellow-400 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-lg">★</span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Berdasarkan 15 ulasan</p>
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
                            style={{ width: `${rating === 5 ? 100 : rating === 4 ? 0 : 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300 w-8">
                          {rating === 5 ? '15' : '0'}
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
        itemType="catalog"
        itemId={data.id.toString()}
      />
    </div>
  );
};
