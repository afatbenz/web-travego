import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImagePopupProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onImageChange: (index: number) => void;
  itemType?: string;
  itemId?: string;
}

export const ImagePopup: React.FC<ImagePopupProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onImageChange,
  itemType = 'catalog',
  itemId = '1'
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const currentImage = images[currentIndex];

  const goToPrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    onImageChange(newIndex);
  };

  const goToNext = () => {
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    onImageChange(newIndex);
  };

  return (
    <div className="fixed inset-0 bg-white/90 dark:bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-end p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Section - Main Image */}
          <div className="flex-1 relative">
            <img
              src={currentImage}
              alt={`Gallery image ${currentIndex + 1}`}
              className="w-full h-full object-cover"
            />
            
            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Right Section - Photo List & Reviews */}
          <div className="w-96 p-4 border-l bg-gray-50 dark:bg-gray-900">
            {/* Photo List */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Semua Foto ({images.length})
              </h3>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {images.map((image, index) => (
                  <div
                    key={index}
                    onClick={() => onImageChange(index)}
                    className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                      index === currentIndex
                        ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500'
                        : 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-16 h-12 object-cover rounded-md flex-shrink-0"
                    />
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Foto {index + 1}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {index === currentIndex ? 'Sedang dilihat' : 'Klik untuk melihat'}
                      </p>
                    </div>
                    {index === currentIndex && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Ulasan (2)
              </h3>
              
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {/* Review 1 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                      A
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Ahmad Rizki</p>
                      <div className="flex items-center">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className="text-xs">★</span>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">2 hari yang lalu</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    "Paket tour yang sangat memuaskan! Pelayanan guide sangat baik dan tempat wisata yang dikunjungi sesuai dengan yang dijanjikan. Recommended!"
                  </p>
                </div>

                {/* Review 2 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                      S
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Sari Dewi</p>
                      <div className="flex items-center">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className="text-xs">★</span>
                          ))}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">1 minggu yang lalu</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    "Pengalaman wisata yang tak terlupakan! Hotel bagus, makanan enak, dan transportasi nyaman. Worth it banget untuk harga segini."
                  </p>
                </div>
              </div>

              {/* View All Reviews Button */}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-4"
                onClick={() => navigate(`/reviews/${itemType}/${itemId}`)}
              >
                Lihat Semua Ulasan
              </Button>
            </div>
          </div>
        </div>

        {/* Thumbnail Strip */}
        <div className="p-4 border-t bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-3">
            <Button variant="outline" size="sm" className="text-blue-600">
              All photo and video ({images.length})
            </Button>
          </div>
          
          <div className="flex space-x-2 overflow-x-auto">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => onImageChange(index)}
                className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${
                  index === currentIndex
                    ? 'border-blue-600'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
