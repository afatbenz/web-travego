import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const OrganizationChoiceDashboard: React.FC = () => {
  const navigate = useNavigate();

  const handleCreate = () => {
    navigate('/dashboard/partner/organization/register');
  };

  const handleGoJoin = () => {
    navigate('/dashboard/partner/organization/join');
  };

  return (
    <div className="w-full min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mb-2">
            <AlertTriangle className="h-10 w-10 text-yellow-600" />
          </div>
        <p className="text-center text-base md:text-lg text-yellow-800 dark:text-yellow-200">
          Untuk menggunakan fitur TraveGo anda perlu tergabung dalam organization. Saat ini anda belum tergabung di organization manapun
        </p>
        </div>
        <div className="mb-4 flex items-center justify-center space-x-2 text-blue-600">
          <Info className="h-5 w-5" />
          <span className="text-sm">Buat organisasi baru atau bergabung dengan organisasi yang sudah ada</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Button onClick={handleCreate} className="h-12 w-full bg-blue-600 hover:bg-blue-700 text-white">
            <Building2 className="h-4 w-4 mr-2" />
            Buat Organisasi
          </Button>
          <Button variant="outline" onClick={handleGoJoin} className="h-12 w-full">
            <Users className="h-4 w-4 mr-2" />
            Gabung Organisasi
          </Button>
        </div>
      </div>
    </div>
  );
};
