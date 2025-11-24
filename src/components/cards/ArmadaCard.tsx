import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, Users, Calendar, Heart, Eye } from 'lucide-react';

interface ArmadaCardProps {
  armada: {
    id: number;
    name: string;
    type: string;
    capacity: string;
    price: string;
    originalPrice: string;
    image: string;
    rating: number;
    reviews: number;
    features: string[];
    location: string;
    year: string;
    transmission: string;
    fuel: string;
    badge: string;
    discount: string;
  };
  viewMode?: 'grid' | 'list';
}

export const ArmadaCard: React.FC<ArmadaCardProps> = ({ armada, viewMode = 'grid' }) => {
  const navigate = useNavigate();

  const handleDetailClick = () => {
    navigate(`/detail/armada/${armada.id}`);
  };
  if (viewMode === 'list') {
    return (
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300" style={{ height: '20rem' }}>
        <div className="flex h-full">
          {/* Image Section - Left Side */}
          <div className="relative w-[32rem] flex-shrink-0 h-full">
            <img
              src={armada.image}
              alt={armada.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge className={`text-xs ${
                armada.badge === 'Popular' ? 'bg-blue-600 hover:bg-blue-600' :
                armada.badge === 'New' ? 'bg-green-600 hover:bg-green-600' :
                armada.badge === 'Luxury' ? 'bg-purple-600 hover:bg-purple-600' :
                armada.badge === 'Economical' ? 'bg-orange-600 hover:bg-orange-600' :
                'bg-gray-600 hover:bg-gray-600'
              }`}>
                {armada.badge}
              </Badge>
              <Badge variant="destructive" className="text-xs">
                {armada.discount}
              </Badge>
            </div>
            <div className="absolute top-3 right-3 flex gap-2">
              <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                <Heart className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Content Section - Right Side */}
          <CardContent className="p-6 flex flex-col flex-1">
            <div className="flex-1">
              <h3 className="font-semibold text-xl mb-2 text-gray-900 dark:text-white">
                {armada.name}
              </h3>
              
              {/* Garis tipis di bawah judul */}
              <div className="border-t border-gray-200 dark:border-gray-700 mb-4"></div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{armada.capacity}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{armada.location}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Durasi: {armada.year} • {armada.transmission} • {armada.fuel}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-2" />
                  <span>{armada.rating} ({armada.reviews} reviews)</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {armada.features.slice(0, 6).map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                  {armada.features.length > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{armada.features.length - 6} lagi
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
                  <span className="text-sm text-gray-500 line-through block">
                    {armada.originalPrice}
                  </span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {armada.price}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">/hari</span>
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
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col">
      <div className="relative overflow-hidden h-60">
        <img
          src={armada.image}
          alt={armada.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className={`text-xs ${
            armada.badge === 'Popular' ? 'bg-blue-600 hover:bg-blue-600' :
            armada.badge === 'New' ? 'bg-green-600 hover:bg-green-600' :
            armada.badge === 'Luxury' ? 'bg-purple-600 hover:bg-purple-600' :
            armada.badge === 'Economical' ? 'bg-orange-600 hover:bg-orange-600' :
            'bg-gray-600 hover:bg-gray-600'
          }`}>
            {armada.badge}
          </Badge>
          <Badge variant="destructive" className="text-xs">
            {armada.discount}
          </Badge>
        </div>
        <div className="absolute top-3 right-3 flex gap-2">
          <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
            <Heart className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4 flex flex-col h-full">
        <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white line-clamp-2">
          {armada.name}
        </h3>
        
        {/* Garis tipis di bawah judul */}
        <div className="border-t border-gray-200 dark:border-gray-700 mb-4"></div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Users className="h-4 w-4 mr-2" />
            <span>{armada.capacity}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{armada.location}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Durasi: {armada.year} • {armada.transmission} • {armada.fuel}</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex flex-wrap gap-1 max-h-12 overflow-hidden">
            {armada.features.slice(0, 4).map((feature, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
            {armada.features.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{armada.features.length - 4} lagi
              </Badge>
            )}
          </div>
        </div>

        <div className="mt-auto">
          {/* Garis tipis di atas original price */}
          <div className="border-t border-gray-200 dark:border-gray-700 mb-3"></div>
          
          <div className="mb-3 flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-500 line-through block">
                {armada.originalPrice}
              </span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {armada.price}
              </span>
              <span className="text-sm text-gray-500 ml-1">/hari</span>
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="ml-1 text-sm text-gray-600 dark:text-gray-300">
                {armada.rating} ({armada.reviews})
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
