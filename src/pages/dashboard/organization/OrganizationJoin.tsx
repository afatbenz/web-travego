import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Loader2, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { request } from '@/lib/api';
import { showAlert } from '@/hooks/use-alert';

export const OrganizationJoinDashboard: React.FC = () => {
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
    const res = await request('/organization/join', {
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const token = localStorage.getItem('token') ?? '';
            let isAdmin = false;
            try {
              const payloadStr = token.split('.')[1];
              const base64 = payloadStr.replace(/-/g, '+').replace(/_/g, '/');
              const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
              const json = JSON.parse(atob(padded));
              isAdmin = Boolean(json.is_admin ?? json.isAdmin ?? false);
            } catch {}
            navigate(isAdmin ? '/dashboard/organization/choice' : '/dashboard/partner/organization/choice');
          }}
          className="!w-auto !h-auto p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gabung Organisasi</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Permintaan anda akan disetujui oleh admin organisasi. Setelah admin organisasi menyetujui, anda akan mendapatkan update di email</p>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
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
          <Button onClick={handleJoin} disabled={joining} className="h-12 w-full bg-blue-600 hover:bg-blue-700 text-white">
            {joining ? (<span className="flex items-center justify-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memproses...</span>) : 'Gabung Organisasi'}
          </Button>
        </div>
      </div>
    </div>
  );
};
