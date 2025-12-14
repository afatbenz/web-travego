import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MailCheck } from 'lucide-react';
import { AuthLayout } from '@/pages/LandingPage/Auth/AuthLayout';
import { Button } from '@/components/ui/button';

export const OrganizationPending: React.FC = () => {
  const navigate = useNavigate();
  return (
    <AuthLayout
      title="Menunggu Persetujuan"
      subtitle={`Permintaan bergabung organisasi sedang menunggu approval admin.
Anda akan menerima email jika sudah disetujui, lalu silakan login kembali.`}
    >
      <div className="space-y-6 text-center">
        <div className="flex items-center justify-center space-x-2 text-yellow-600">
          <Clock className="h-5 w-5" />
          <span className="text-sm">Proses approval biasanya memakan waktu beberapa saat</span>
        </div>
        <div className="flex items-center justify-center space-x-2 text-green-600">
          <MailCheck className="h-5 w-5" />
          <span className="text-sm">Notifikasi akan dikirimkan melalui email</span>
        </div>
        <Button variant="outline" onClick={() => navigate('/auth/login')} className="h-12 w-full max-w-xs mx-auto">
          Kembali ke Login
        </Button>
      </div>
    </AuthLayout>
  );
};

