import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DetailBannerProps {
  title: string;
  subtitle?: string;
  location?: string;
  type?: string;
  capacity?: string;
  year?: string;
  showMapButton?: boolean;
  onBackClick?: () => void;
  className?: string;
}

export const DetailBanner: React.FC<DetailBannerProps> = ({
  title,
  subtitle,
  location,
  type,
  capacity,
  year,
  showMapButton = false,
  onBackClick,
  className = ''
}) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <section className={`relative h-96 w-full text-white overflow-hidden ${className}`}>
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
            onClick={handleBackClick}
            className="!w-auto !h-auto p-2 mb-6 bg-transparent text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          {/* Title */}
          <h1 className="text-4xl font-bold mb-4 text-white">
            {title}
          </h1>

          {/* Location or Vehicle Info */}
          <div className="flex items-center mb-4">
            {location ? (
              <>
                <MapPin className="h-5 w-5 mr-2 text-white" />
                <span className="text-white mr-4">{location}</span>
                {showMapButton && (
                  <Button variant="link" className="text-green-300 hover:text-green-200 p-0 h-auto">
                    Show Map
                  </Button>
                )}
              </>
            ) : (
              <>
                <Car className="h-5 w-5 mr-2 text-white" />
                <span className="text-white mr-4">{type} • {capacity}</span>
                {year && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {year}
                  </Badge>
                )}
              </>
            )}
          </div>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-lg text-white/90 mb-6">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
