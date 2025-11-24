import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Heart, Eye } from 'lucide-react';

interface CatalogCardProps {
  item: {
    id: number;
    title: string;
    description: string;
    price: string;
    originalPrice?: string;
    image: string;
    rating: number;
    reviewCount: number;
    location: string;
    duration: string;
    features: string[];
    isPopular?: boolean;
    isNew?: boolean;
    discount?: number;
  };
  viewMode?: 'grid' | 'list';
}

export const CatalogCard: React.FC<CatalogCardProps> = ({ item, viewMode = 'grid' }) => {
  const navigate = useNavigate();

  const handleDetailClick = () => {
    navigate(`/detail/catalog/${item.id}`);
  };
  if (viewMode === 'list') {
    return (
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800" style={{ height: '20rem' }}>
        <div className="flex h-full">
          {/* Image Section - Left Side */}
          <div className="relative w-[32rem] flex-shrink-0 h-full">
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-4 left-4 flex flex-col space-y-2">
              {item.isPopular && (
                <Badge className="bg-red-500 hover:bg-red-500 text-white">
                  Popular
                </Badge>
              )}
              {item.isNew && (
                <Badge className="bg-green-500 hover:bg-green-500 text-white">
                  Baru
                </Badge>
              )}
              {item.discount && item.discount > 0 && (
                <Badge className="bg-orange-500 hover:bg-orange-500 text-white">
                  -{item.discount}%
                </Badge>
              )}
            </div>
            <div className="absolute top-4 right-4 flex flex-col space-y-2">
              <Button size="sm" variant="secondary" className="bg-white/80 backdrop-blur-md hover:bg-white">
                <Heart className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="secondary" className="bg-white/80 backdrop-blur-md hover:bg-white">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Content Section - Right Side */}
          <CardContent className="p-6 flex flex-col flex-1">
            <div className="flex-1">
              <h3 className="font-semibold text-xl mb-2 text-gray-900 dark:text-white">
                {item.title}
              </h3>
              
              {/* Garis tipis di bawah judul */}
              <div className="border-t border-gray-200 dark:border-gray-700 mb-4"></div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                {item.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                  <span>{item.location}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <span>Durasi: {item.duration}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-2" />
                  <span>{item.rating} ({item.reviewCount} reviews)</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {item.features.slice(0, 6).map((feature, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {item.features.length > 6 && (
                    <Badge variant="secondary" className="text-xs">
                      +{item.features.length - 6} lagi
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {/* Price and Button Section - Bottom */}
            <div className="mt-auto">
              <div className="border-t border-gray-200 dark:border-gray-700 mb-3"></div>
              <div className="flex justify-between items-center">
                <div>
                  {item.originalPrice && (
                    <span className="text-sm text-gray-500 line-through block">
                      {item.originalPrice}
                    </span>
                  )}
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {item.price}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">/pax</span>
                </div>
                <Button className="w-32" onClick={handleDetailClick}>
                  Lihat Detail
                </Button>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  // Grid View (Default)
  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white dark:bg-gray-800 h-full flex flex-col">
      <div className="relative overflow-hidden h-60">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4 flex flex-col space-y-2">
          {item.isPopular && (
            <Badge className="bg-red-500 hover:bg-red-500 text-white">
              Popular
            </Badge>
          )}
          {item.isNew && (
            <Badge className="bg-green-500 hover:bg-green-500 text-white">
              Baru
            </Badge>
          )}
          {item.discount && item.discount > 0 && (
            <Badge className="bg-orange-500 hover:bg-orange-500 text-white">
              -{item.discount}%
            </Badge>
          )}
        </div>
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <Button size="sm" variant="secondary" className="bg-white/80 backdrop-blur-md hover:bg-white">
            <Heart className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="secondary" className="bg-white/80 backdrop-blur-md hover:bg-white">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <CardContent className="p-6 flex flex-col h-full">
        {/* Content Section */}
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white line-clamp-2">
            {item.title}
          </h3>
          
          {/* Garis tipis di bawah judul */}
          <div className="border-t border-gray-200 dark:border-gray-700 mb-3"></div>
          
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
            {item.description}
          </p>
          
          <div className="flex items-center mb-3">
            <MapPin className="h-4 w-4 text-gray-400 mr-1" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {item.location}
            </span>
            <span className="mx-2 text-gray-400">•</span>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Durasi: {item.duration}
            </span>
          </div>

          <div className="flex flex-wrap gap-1 max-h-12 overflow-hidden mb-4">
            {item.features.slice(0, 4).map((feature, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
            {item.features.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{item.features.length - 4} lagi
              </Badge>
            )}
          </div>
        </div>

        {/* Bottom Section - Always at bottom */}
        <div className="mt-auto">
          {/* Garis tipis di atas original price */}
          <div className="border-t border-gray-200 dark:border-gray-700 mb-3"></div>
          
          <div className="mb-2 flex items-center justify-between">
            <div>
              {item.originalPrice && (
                <span className="text-sm text-gray-500 line-through block">
                  {item.originalPrice}
                </span>
              )}
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {item.price}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">/pax</span>
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm text-gray-600 dark:text-gray-300">
                {item.rating}
              </span>
              <span className="ml-1 text-xs text-gray-500">
                ({item.reviewCount})
              </span>
            </div>
          </div>
                <Button className="w-full" onClick={handleDetailClick}>
                  Lihat Detail
                </Button>
        </div>
      </CardContent>
    </Card>
  );
};
