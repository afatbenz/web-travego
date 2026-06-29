import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Loader2, ArrowLeft, Send, Info, Building2, Hourglass, CheckCircle, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { request } from '@/lib/api';
import { showAlert } from '@/hooks/use-alert';

export const OrganizationJoinDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    console.log("handleJoin ", code)
    if (!code.trim()) {
      showAlert({ title: 'Kode diperlukan', description: 'Masukkan kode organisasi untuk bergabung', type: 'warning' });
      return;
    }
    setJoining(true);
    const token = localStorage.getItem('token') ?? '';
    console.log({token})
    try {

      const res = await request('/organization/join', {
        method: 'POST',
        body: JSON.stringify({ organization_code: code.trim() }),
        headers: { Authorization: token },
      });
      console.log(res)
      setJoining(false);
      if (res.status === 'success') {
        navigate('/auth/organization/pending');
      }
    } catch (err) {
      console.log(err)
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            navigate('/dashboard/organization/choice');
          }}
          className="!w-auto !h-auto p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gabung Organisasi</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Kirim permintaan untuk bergabung ke organisasi yang sudah ada. Setelah disetujui oleh admin organisasi, Anda akan mendapatkan update di email.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Gabung ke Organisasi</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">Masukkan kode organisasi untuk mengirim permintaan bergabung.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Masukkan Kode Organisasi"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Button onClick={handleJoin} disabled={joining} className="h-12 w-full bg-blue-600 hover:bg-blue-700 text-white">
              {joining ? (<span className="flex items-center justify-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memproses...</span>) : (<span className="flex items-center justify-center"><Send className="mr-2 h-4 w-4" />Kirim Permintaan Gabung</span>)}
            </Button>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Di mana saya menemukan kode?</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Kode organisasi dapat diperoleh dari admin organisasi yang ingin Anda gabungi.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Bagaimana prosesnya?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center relative">
            <div className="hidden md:block absolute top-5 left-[60%] right-[-46%] border-t-2 border-dashed border-gray-300"></div>
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 mb-3 relative z-10">
              <span className="text-sm font-bold text-purple-600">1</span>
            </div>
            <div className="bg-white rounded-lg shadow p-5 w-full">
              <div className="flex flex-col items-center mb-3">
                <Send className="h-6 w-6 text-gray-700 mb-1" />
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Kirim Permintaan</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">Masukkan kode organisasi dan kirim permintaan gabung.</p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center relative">
            <div className="hidden md:block absolute top-5 left-[60%] right-[-46%] border-t-2 border-dashed border-gray-300"></div>
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 mb-3 relative z-10">
              <span className="text-sm font-bold text-purple-600">2</span>
            </div>
            <div className="bg-gray-50 rounded-lg shadow p-5 w-full">
              <div className="flex flex-col items-center mb-3">
                <Hourglass className="h-6 w-6 text-gray-700 mb-1" />
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Menunggu Persetujuan</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">Admin organisasi akan meninjau dan menyetujui permintaan Anda.</p>
            </div>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 mb-3 relative z-10">
              <span className="text-sm font-bold text-purple-600">3</span>
            </div>
            <div className="bg-white rounded-lg shadow p-5 w-full">
              <div className="flex flex-col items-center mb-3">
                <CheckCircle className="h-6 w-6 text-green-600 mb-1" />
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Akses Diberikan</h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">Setelah disetujui, Anda akan mendapatkan akses ke organisasi.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <HelpCircle className="h-4 w-4 text-blue-600 rounded-full bg-blue-50 p-0.5" />
        <span className="text-gray-600 dark:text-gray-300">Butuh bantuan?</span>
        <button
          onClick={() => window.open('https://wa.me/6285195911626', '_blank')}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Pelajari lebih lanjut tentang organisasi ›
        </button>
      </div>
    </div>
  );
};
