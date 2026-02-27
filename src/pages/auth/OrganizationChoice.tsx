import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Info } from 'lucide-react';
import { AuthLayout } from '@/pages/LandingPage/Auth/AuthLayout';
import { Button } from '@/components/ui/button';

export const OrganizationChoice: React.FC = () => {
  const navigate = useNavigate();

  const handleCreate = () => {
    navigate('/auth/organization/register');
  };

  const handleGoJoin = () => {
    navigate('/auth/organization/join');
  };

  return (
    <AuthLayout
      title="Organisasi Belum Tersedia"
      subtitle={`Anda belum memiliki organisasi. Pilih salah satu opsi di bawah untuk melanjutkan.`}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-center space-x-2 text-blue-600">
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
    </AuthLayout>
  );
};
