import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Loader2 } from 'lucide-react';
import { AuthLayout } from '@/pages/LandingPage/Auth/AuthLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { request } from '@/lib/api';
import { showAlert } from '@/hooks/use-alert';

export const OrganizationJoin: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) {
      showAlert({ title: 'Kode diperlukan', description: 'Masukkan kode organisasi untuk bergabung', type: 'warning' });
      return;
    }
    setJoining(true);
    const token = localStorage.getItem('token') ?? '';
    const res = await request('http://localhost:3100/api/organization/join', {
      method: 'GET',
      body: JSON.stringify({ organization_code: code.trim() }),
      headers: { Authorization: token },
    });
    setJoining(false);
    if (res.status === 'success') {
      navigate('/auth/organization/pending');
    }
  };

  return (
    <AuthLayout title="Gabung Organisasi" subtitle="Masukkan kode organisasi Anda untuk bergabung">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Masukkan Kode Organisasi"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>
        <Button variant="outline" onClick={handleJoin} disabled={joining} className="h-12 w-full">
          {joining ? (<span className="flex items-center justify-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memproses...</span>) : 'Gabung Organisasi'}
        </Button>
      </div>
    </AuthLayout>
  );
};
