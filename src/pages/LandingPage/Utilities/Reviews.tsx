import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Filter, Search, ChevronDown, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Sample reviews data
const reviewsData = [
  {
    id: 1,
    userName: "Ahmad Rizki",
    userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    date: "2024-01-15",
    title: "Pengalaman yang sangat memuaskan!",
    review: "Pelayanan yang sangat baik, driver ramah dan profesional. Mobil bersih dan nyaman. Perjalanan ke Bandung sangat menyenangkan. Highly recommended!",
    helpful: 12,
    verified: true
  },
  {
    id: 2,
    userName: "Siti Nurhaliza",
    userAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
    rating: 4,
    date: "2024-01-12",
    title: "Armada nyaman dan driver berpengalaman",
    review: "Armada yang digunakan sangat nyaman, AC dingin, dan kursi empuk. Driver berpengalaman dan tahu jalan-jalan alternatif. Hanya sedikit terlambat dari jadwal.",
    helpful: 8,
    verified: true
  },
  {
    id: 3,
    userName: "Budi Santoso",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    date: "2024-01-10",
    title: "Paket wisata lengkap dan terorganisir",
    review: "Paket wisata ke Yogyakarta sangat lengkap. Hotel bagus, makanan enak, dan tempat wisata menarik. Guide lokal sangat informatif. Worth every penny!",
    helpful: 15,
    verified: true
  },
  {
    id: 4,
    userName: "Dewi Kartika",
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    rating: 4,
    date: "2024-01-08",
    title: "Pelayanan customer service responsif",
    review: "Customer service sangat responsif dan membantu. Proses booking mudah dan cepat. Armada sesuai dengan yang dipesan. Overall experience bagus.",
    helpful: 6,
    verified: false
  },
  {
    id: 5,
    userName: "Rizki Pratama",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    rating: 3,
    date: "2024-01-05",
    title: "Cukup baik, ada beberapa kendala",
    review: "Pelayanan cukup baik, tapi ada beberapa kendala teknis. Mobil sedikit berisik dan AC kurang dingin. Driver baik dan sopan. Harga sesuai dengan kualitas.",
    helpful: 4,
    verified: true
  },
  {
    id: 6,
    userName: "Maya Sari",
    userAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    date: "2024-01-03",
    title: "Perjalanan keluarga yang menyenangkan",
    review: "Perjalanan ke Bali dengan keluarga sangat menyenangkan. Driver ramah dengan anak-anak, mobil nyaman untuk perjalanan jauh. Hotel dan makanan sesuai ekspektasi.",
    helpful: 18,
    verified: true
  },
  {
    id: 7,
    userName: "Agus Wijaya",
    userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    rating: 4,
    date: "2024-01-01",
    title: "Armada premium dengan harga terjangkau",
    review: "Mendapatkan armada premium dengan harga yang terjangkau. Mobil bersih, nyaman, dan driver profesional. Perjalanan bisnis ke Jakarta sangat lancar.",
    helpful: 9,
    verified: true
  },
  {
    id: 8,
    userName: "Linda Putri",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    date: "2023-12-28",
    title: "Paket honeymoon yang romantis",
    review: "Paket honeymoon ke Lombok sangat romantis dan memorable. Hotel dengan pemandangan sunset yang indah, aktivitas yang beragam, dan pelayanan yang personal.",
    helpful: 22,
    verified: true
  }
];

export const Reviews: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300 dark:text-gray-600'
        }`}
      />
    ));
  };

  const filteredReviews = reviewsData.filter(review => {
    const matchesSearch = review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.review.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating = ratingFilter === 'all' || review.rating.toString() === ratingFilter;
    
    return matchesSearch && matchesRating;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'oldest':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      case 'most_helpful':
        return b.helpful - a.helpful;
      default:
        return 0;
    }
  });

  const averageRating = reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length;
  const totalReviews = reviewsData.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="!w-auto !h-auto p-2 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Ulasan & Rating
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Ulasan dari pelanggan yang telah menggunakan layanan kami
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Rating Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-gray-900 dark:text-white">
                      {averageRating.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center mt-1">
                      {renderStars(Math.round(averageRating))}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {totalReviews} ulasan
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviewsData.filter(r => r.rating === rating).length;
                      const percentage = (count / totalReviews) * 100;
                      return (
                        <div key={rating} className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 dark:text-gray-300 w-8">{rating}</span>
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-300 w-8">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Cari ulasan..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Rating Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="all">Semua Rating</option>
                    <option value="5">5 Bintang</option>
                    <option value="4">4 Bintang</option>
                    <option value="3">3 Bintang</option>
                    <option value="2">2 Bintang</option>
                    <option value="1">1 Bintang</option>
                  </select>
                </div>

                {/* Sort */}
                <div className="flex items-center space-x-2">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="newest">Terbaru</option>
                    <option value="oldest">Terlama</option>
                    <option value="highest">Rating Tertinggi</option>
                    <option value="lowest">Rating Terendah</option>
                    <option value="most_helpful">Paling Membantu</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews List */}
          <div className="space-y-4">
            {sortedReviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <img
                      src={review.userAvatar}
                      alt={review.userName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {review.userName}
                          </h3>
                          {review.verified && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(review.date)}
                          </span>
                        </div>
                      </div>
                      
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {review.title}
                      </h4>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                        {review.review}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>{review.helpful} orang merasa ini membantu</span>
                        </div>
                        <Button variant="ghost" size="sm" className="bg-transparent text-blue-600 hover:text-blue-700 hover:bg-transparent">
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Bermanfaat
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Results */}
          {sortedReviews.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Tidak ada ulasan yang sesuai dengan filter yang dipilih.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
