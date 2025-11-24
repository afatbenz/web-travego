import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backButtonText?: string;
  maxWidth?: '4xl' | '6xl';
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBackButton = true,
  maxWidth = '6xl',
  className = ''
}) => {
  const navigate = useNavigate();

  return (
    <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className={`max-w-${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-24`}>
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)} 
              className="!w-auto !h-auto p-2 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
