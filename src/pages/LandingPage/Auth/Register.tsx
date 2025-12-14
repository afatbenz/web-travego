import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Phone, ShieldCheck, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AuthLayout } from './AuthLayout';

export const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [policyType, setPolicyType] = useState<'terms' | 'privacy'>('terms');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '+62',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const formatPhone = (raw: string) => {
    let digits = raw.replace(/\D/g, '');
    if (!digits) return '+62';
    if (digits.startsWith('0')) {
      digits = '62' + digits.slice(1);
    } else if (!digits.startsWith('62')) {
      digits = '62' + digits;
    }
    if (digits.length >= 3 && digits[2] === '0') {
      digits = '62' + digits.slice(3);
    }
    return '+' + digits;
  };

  const normalizePhoneForApi = (raw: string) => {
    let digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('0')) {
      digits = '62' + digits.slice(1);
    } else if (!digits.startsWith('62')) {
      digits = '62' + digits;
    }
    if (digits.length >= 3 && digits[2] === '0') {
      digits = '62' + digits.slice(3);
    }
    return digits;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    const formatted = formatPhone(v);
    setFormData(prev => ({ ...prev, phone: formatted }));
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const caret = target.selectionStart ?? 0;
    if ((e.key === 'Backspace' || e.key === 'Delete') && caret <= 1) {
      e.preventDefault();
    }
    if (e.key === '+') {
      e.preventDefault();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Password tidak sama!');
      return;
    }

    if (!formData.acceptTerms) {
      alert('Harap menyetujui syarat dan ketentuan');
      return;
    }

    (async () => {
      try {
        setSubmitting(true);
        const payload = {
          fullname: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: normalizePhoneForApi(formData.phone),
        };
        const res = await (await import('@/lib/api')).api.post<any>('http://localhost:3100/api/auth/register', payload);
        if (res.status === 'success') {
          const token = (res.data?.token) ?? '';
          const email = (res.data?.profile?.email) ?? formData.email;
          localStorage.setItem('register_token', token);
          localStorage.setItem('register_email', email);
          navigate('/auth/otp');
        }
        setSubmitting(false);
      } catch {
        // Error ditangani global oleh api util
        setSubmitting(false);
      }
    })();
  };

  return (
    <AuthLayout
      title="Buat Akun Baru"
      subtitle="Bergabunglah dengan TraveGO untuk pengalaman perjalanan terbaik"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="Masukkan nama lengkap"
                value={formData.fullName}
                onChange={handleInputChange}
                className="pl-10 h-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="contoh@email.com"
                value={formData.email}
                onChange={handleInputChange}
                className="pl-10 h-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Nomor Telepon
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="+62812xxxxxx"
                value={formData.phone}
                onChange={handlePhoneChange}
                onKeyDown={handlePhoneKeyDown}
                className="pl-10 h-12"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Masukkan password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-transparent"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Ulangi password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-transparent"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {formData.confirmPassword && formData.confirmPassword !== formData.password && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">Password belum sesuai</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <div className="mt-1">
            <Checkbox
              id="acceptTerms"
              checked={formData.acceptTerms}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, acceptTerms: checked as boolean }))
              }
              className="cursor-pointer bg-transparent data-[state=checked]:bg-transparent data-[state=checked]:border-blue-600 data-[state=checked]:text-blue-600"
            />
          </div>
          <label 
            htmlFor="acceptTerms" 
            className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer flex-1 select-none"
            onClick={(e) => {
              const el = e.target as HTMLElement;
              if (el.closest('a[href="/terms"]')) {
                e.preventDefault();
                setPolicyType('terms');
                setPolicyOpen(true);
              } else if (el.closest('a[href="/privacy"]')) {
                e.preventDefault();
                setPolicyType('privacy');
                setPolicyOpen(true);
              }
            }}
          >
            Saya menyetujui{' '}
            <Link 
              to="/terms" 
              className="text-blue-600 dark:text-blue-400 hover:underline"
              onClick={(e) => { e.preventDefault(); setPolicyType('terms'); setPolicyOpen(true); }}
            >
              Syarat dan Ketentuan
            </Link>
            {' '}serta{' '}
            <Link 
              to="/privacy" 
              className="text-blue-600 dark:text-blue-400 hover:underline"
              onClick={(e) => { e.preventDefault(); setPolicyType('privacy'); setPolicyOpen(true); }}
            >
              Kebijakan Privasi
            </Link>
            {' '}TraveGO
          </label>
        </div>

        <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700" disabled={!formData.acceptTerms || submitting}>
          {submitting ? (<span className="flex items-center justify-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mendaftar...</span>) : 'Daftar Sekarang'}
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sudah punya akun?{' '}
            <Link
              to="/auth/login"
              className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Masuk di sini
            </Link>
          </p>
        </div>
        <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-center space-x-2">
                {policyType === 'terms' ? (
                  <ShieldCheck className="h-5 w-5 text-blue-600 animate-pulse" />
                ) : (
                  <FileText className="h-5 w-5 text-blue-600 animate-pulse" />
                )}
                <DialogTitle>{policyType === 'terms' ? 'Syarat dan Ketentuan' : 'Kebijakan Privasi'}</DialogTitle>
              </div>
              <DialogDescription>
                {policyType === 'terms'
                  ? 'Dengan menggunakan layanan TraveGO, Anda menyetujui ketentuan penggunaan, batasan tanggung jawab, dan kebijakan pemesanan yang berlaku.'
                  : 'Kami menghargai privasi Anda. Data pribadi digunakan untuk memberikan layanan dan tidak dibagikan tanpa persetujuan kecuali diwajibkan oleh hukum.'}
              </DialogDescription>
            </DialogHeader>
            <div className="my-2 h-px bg-gray-200 dark:bg-gray-800" />
            <div className="max-h-64 overflow-y-auto space-y-3 text-sm text-gray-700 dark:text-gray-300">
              <p>Mohon baca dengan teliti informasi berikut sebelum melanjutkan proses pendaftaran akun TraveGO Anda.</p>
              <p>Dengan menekan tombol Setuju, Anda menyetujui untuk mematuhi seluruh ketentuan layanan, termasuk kebijakan pembatalan, pengembalian dana, dan perubahan jadwal yang mungkin dikenakan biaya.</p>
              <p>Kami berkomitmen menjaga keamanan data Anda. Informasi yang Anda berikan digunakan untuk memproses pesanan, meningkatkan layanan, dan pengalaman pengguna.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Tidak membagikan kredensial akun kepada pihak lain.</li>
                <li>Memastikan data pribadi yang dimasukkan akurat dan terbaru.</li>
                <li>Mematuhi peraturan perundang-undangan yang berlaku.</li>
                <li>Menyetujui pengolahan data sesuai kebijakan privasi TraveGO.</li>
              </ul>
              <p>Jika Anda tidak setuju dengan ketentuan atau kebijakan privasi, silakan tutup modal ini dan hubungi kami untuk bantuan lebih lanjut.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPolicyOpen(false)}>Tutup</Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => { setPolicyOpen(false); setFormData(prev => ({ ...prev, acceptTerms: true })); }}>Setuju</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>
    </AuthLayout>
  );
};
