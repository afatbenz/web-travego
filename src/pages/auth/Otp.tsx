import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, MailCheck, Clock, Loader2 } from 'lucide-react';
import { AuthLayout } from '@/pages/LandingPage/Auth/AuthLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { showAlert } from '@/hooks/use-alert';

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const first = local.slice(0, 2);
  const last = local.slice(-3);
  const stars = '*'.repeat(Math.max(0, local.length - (first.length + last.length)));
  return `${first}${stars}${last}@${domain}`;
}

export const Otp: React.FC = () => {
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const token = useMemo(() => localStorage.getItem('register_token') ?? '', []);
  const email = useMemo(() => localStorage.getItem('register_email') ?? '', []);

  useEffect(() => {
    if (!token) {
      navigate('/auth/register');
    }
  }, [token, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleVerify = async () => {
    const otpStr = digits.join('');
    if (!otpStr || otpStr.length < 6) {
      showAlert({ title: 'OTP tidak valid', description: 'Masukkan kode OTP dengan benar', type: 'warning' });
      return;
    }
    setVerifying(true);
    const res = await api.post('/auth/verify-otp', { token, otp: otpStr });
    setVerifying(false);
    if (res.status === 'success') {
      showAlert({ title: 'Verifikasi Berhasil', description: 'Akun Anda telah terverifikasi. Silakan Login untuk melanjutkan', type: 'success' });
      navigate('/auth/login');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    if (!email) {
      showAlert({ title: 'Email tidak ditemukan', description: 'Silakan daftar ulang', type: 'error' });
      return;
    }
    setResending(true);
    const res = await api.post('/auth/resend-otp', { email });
    setResending(false);
    if (res.status === 'success') {
      showAlert({ title: 'OTP Dikirim Ulang', description: 'Silakan cek email Anda kembali', type: 'success' });
      setCooldown(60);
    }
  };

  return (
    <AuthLayout
      title="Verifikasi OTP"
      subtitle={`OTP dikirimkan ke email ${maskEmail(email)}\nOTP berlaku 5 menit.`}
    >
      <div className="space-y-6 text-center">
        <div className="flex items-center space-x-3 text-blue-600">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-sm">Lindungi akun Anda dengan verifikasi OTP</span>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">Kode OTP</label>
          <div
            className="flex justify-center gap-2"
            onPaste={(e) => {
              const text = e.clipboardData.getData('text').replace(/\D/g, '');
              if (!text) return;
              const next = digits.slice();
              for (let i = 0; i < 6; i++) {
                next[i] = text[i] ?? '';
              }
              setDigits(next);
              const idx = Math.min(text.length, 5);
              inputsRef.current[idx]?.focus();
              e.preventDefault();
            }}
          >
            {digits.map((d, i) => (
              <Input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 1);
                  const next = digits.slice();
                  next[i] = val;
                  setDigits(next);
                  if (val) inputsRef.current[i + 1]?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace') {
                    if (!digits[i]) {
                      inputsRef.current[i - 1]?.focus();
                      const next = digits.slice();
                      next[i - 1] = '';
                      setDigits(next);
                    } else {
                      const next = digits.slice();
                      next[i] = '';
                      setDigits(next);
                    }
                  } else if (e.key === 'ArrowLeft') {
                    inputsRef.current[i - 1]?.focus();
                  } else if (e.key === 'ArrowRight') {
                    inputsRef.current[i + 1]?.focus();
                  } else if (e.key === 'Enter') {
                    handleVerify();
                  }
                }}
                className="h-12 w-12 text-center"
              />
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center space-x-1 text-center">
            <Clock className="h-3 w-3" />
            <span>OTP akan kedaluwarsa dalam 5 menit</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button onClick={handleVerify} disabled={verifying || digits.join('').length !== 6} className="h-12 w-full bg-blue-600 hover:bg-blue-700">
            {verifying ? (<span className="flex items-center justify-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memverifikasi...</span>) : 'Verifikasi OTP'}
          </Button>
          <Button variant="outline" onClick={handleResend} disabled={resending || cooldown > 0} className="h-12 w-full">
            {resending ? (<span className="flex items-center justify-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mengirim...</span>) : (cooldown > 0 ? `Kirim Ulang OTP (${cooldown}s)` : 'Kirim Ulang OTP')}
          </Button>
        </div>

        <div className="text-center text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center space-x-2">
          <MailCheck className="h-4 w-4" />
          <span>Jika tidak menerima email, periksa folder spam/promosi</span>
        </div>
      </div>
    </AuthLayout>
  );
};
