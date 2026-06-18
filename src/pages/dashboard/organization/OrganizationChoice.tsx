import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Info,
  AlertTriangle,
  Plus,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';

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
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Building2 className="h-16 w-16 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-yellow-400 dark:bg-yellow-500 flex items-center justify-center shadow-md">
              <AlertTriangle className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="absolute top-2 left-2 text-green-400 dark:text-green-300">
              <Plus className="h-4 w-4" strokeWidth={3} />
            </span>
            <span className="absolute top-4 right-0 text-yellow-400 dark:text-yellow-300">
              <Plus className="h-3 w-3" strokeWidth={3} />
            </span>
            <span className="absolute bottom-8 -left-4 text-blue-400 dark:text-blue-300">
              <Plus className="h-3 w-3" strokeWidth={3} />
            </span>
            <span className="absolute bottom-4 -right-5 text-purple-400 dark:text-purple-300">
              <Plus className="h-3 w-3" strokeWidth={3} />
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Belum Terhubung ke Organization
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center max-w-lg mb-4">
            Untuk menggunakan fitur TraveGO dan mengakses data organisasi, anda perlu tergabung dalam organization terlebih dahulu.
          </p>

          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 mb-2">
            <Info className="h-4 w-4 text-blue-500 shrink-0" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Buat organization baru atau bergabung dengan organization yang sudah ada.
            </span>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Pilih salah satu opsi di bawah ini
          </p>

          <div className="grid md:grid-cols-2 gap-4 w-full max-w-2xl mb-6">
            <button
              onClick={handleCreate}
              className="group relative flex flex-col rounded-xl border-2 border-blue-500 bg-white dark:bg-gray-900 p-5 text-left transition-all hover:shadow-lg hover:border-blue-600 dark:hover:border-blue-400"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Buat Organization Baru
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Buat organization baru untuk memulai mengelola data perusahaan Anda.
              </p>
              <ul className="space-y-1.5 mt-auto">
                <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  Anda akan menjadi pemilik organization
                </li>
                <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  Kelola tim dan akses anggota
                </li>
                <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  Atur data perusahaan dan preferensi
                </li>
              </ul>
            </button>

            <button
              onClick={handleGoJoin}
              className="group relative flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 text-left transition-all hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-500 dark:text-green-400" />
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600 group-hover:text-green-500 transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Gabung ke Organization
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Gabung ke organization yang sudah ada menggunakan undangan atau kode.
              </p>
              <ul className="space-y-1.5 mt-auto">
                <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  Memerlukan undangan atau kode akses
                </li>
                <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  Akses sesuai dengan peran yang diberikan
                </li>
                <li className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  Langsung berkolaborasi dengan tim
                </li>
              </ul>
            </button>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Butuh bantuan?{' '}
            <a
              href="https://wa.me/6285195911626"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Hubungi kami via WhatsApp ›
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
