import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, request, toFileUrl } from '@/lib/api';
import Swal from 'sweetalert2';
import defaultAvatar from '@/assets/general/avatar.svg';

type Strength = 'lemah' | 'sedang' | 'kuat' | 'sangat kuat';

function computeStrength(pw: string): { score: number; label: Strength } {
  const length = pw.length;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  const score = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length + (length >= 12 ? 1 : 0);
  const label: Strength = score <= 2 ? 'lemah' : score === 3 ? 'sedang' : score === 4 ? 'kuat' : 'sangat kuat';
  return { score, label };
}

function strengthColor(label: Strength): string {
  if (label === 'lemah') return 'text-red-600';
  if (label === 'sedang') return 'text-amber-600';
  if (label === 'kuat') return 'text-green-600';
  return 'text-emerald-700';
}

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const PartnerChangePassword: React.FC = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [avatarPath, setAvatarPath] = useState('');
  const [showExisting, setShowExisting] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [existingStatus, setExistingStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [existingMessage, setExistingMessage] = useState('');
  const existingInputRef = useRef<HTMLInputElement | null>(null);
  const didCheckRef = useRef(false);
  const checkAbortRef = useRef<AbortController | null>(null);
  const [form, setForm] = useState({
    existingPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingProfile(true);
      try {
        const token = localStorage.getItem('token') ?? '';
        const res = await api.get<unknown>('/profile/detail', token ? { Authorization: token } : undefined);
        if (res.status === 'success' && res.data) {
          const d = res.data as Record<string, unknown>;
          const avatarRaw = d.avatar ?? d.photo ?? d.profile_photo ?? d.profilePhoto;
          const avatar = typeof avatarRaw === 'string' ? avatarRaw : '';
          setAvatarPath(avatar);
        }
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, []);

  const strength = useMemo(() => computeStrength(form.newPassword), [form.newPassword]);
  const existingValid = existingStatus === 'valid';

  useEffect(() => {
    checkAbortRef.current?.abort();
    checkAbortRef.current = null;
    setExistingStatus('idle');
    setExistingMessage('');
    didCheckRef.current = false;
    setErrors((prev) => {
      const next = { ...prev };
      delete next.existingPassword;
      return next;
    });
  }, [form.existingPassword]);

  useEffect(() => {
    if (didCheckRef.current) return;
    if (!form.newPassword) return;
    const pw = form.existingPassword;
    if (pw.length < 6) return;

    didCheckRef.current = true;
    setExistingStatus('checking');
    const ac = new AbortController();
    checkAbortRef.current = ac;
    (async () => {
      try {
        const token = localStorage.getItem('token') ?? '';
        const headers = token ? { Authorization: token } : undefined;
        const res = await request<unknown>('/profile/check-password', {
          method: 'POST',
          body: JSON.stringify({ password: pw }),
          headers,
          signal: ac.signal,
        });
        const msg = typeof res.message === 'string' ? res.message.trim() : '';
        const isMismatch = msg.toLowerCase().includes('password tidak sesuai');
        if (res.status === 'success' && !isMismatch) {
          setExistingStatus('valid');
          setExistingMessage(msg || 'Password sesuai');
        } else {
          setExistingStatus('invalid');
          setExistingMessage(msg || 'Password tidak sesuai');
          setForm((p) => ({ ...p, newPassword: '', confirmPassword: '' }));
          setTimeout(() => existingInputRef.current?.focus(), 0);
        }
      } catch {
        if (!ac.signal.aborted) setExistingStatus('invalid');
      }
    })();
  }, [form.existingPassword, form.newPassword]);

  useEffect(() => {
    return () => {
      checkAbortRef.current?.abort();
    };
  }, []);

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.existingPassword) e.existingPassword = 'Password lama wajib diisi';
    if (form.existingPassword && !existingValid) e.existingPassword = 'Password tidak sesuai';
    if (!form.newPassword) e.newPassword = 'Password baru wajib diisi';
    if (form.newPassword && !PASSWORD_RULE.test(form.newPassword)) {
      e.newPassword = 'Minimal 8 karakter, kombinasi huruf besar, huruf kecil, angka, dan karakter spesial';
    }
    if (!form.confirmPassword) e.confirmPassword = 'Konfirmasi password wajib diisi';
    if (form.confirmPassword && form.confirmPassword !== form.newPassword) {
      e.confirmPassword = 'Konfirmasi password tidak sesuai';
    }
    return e;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (saving) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token') ?? '';
      const headers = token ? { Authorization: token } : undefined;
      const validateRes = await api.get<unknown>('/profile/update-password/validate', headers);
      if (validateRes.status !== 'success') return;

      const swalRes = await Swal.fire({
        title: 'Masukkan OTP',
        html: `
          <input
            id="otp"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            class="swal2-input"
            placeholder="6 digit OTP"
          />
        `,
        showCancelButton: true,
        confirmButtonText: 'Ubah Password',
        cancelButtonText: 'Batal',
        focusConfirm: false,
        didOpen: () => {
          const el = document.getElementById('otp') as HTMLInputElement | null;
          if (!el) return;
          el.focus();
          el.addEventListener('input', () => {
            el.value = el.value.replace(/[^0-9]/g, '').slice(0, 6);
          });
        },
        preConfirm: () => {
          const el = document.getElementById('otp') as HTMLInputElement | null;
          const otp = el?.value?.trim() ?? '';
          if (!/^\d{6}$/.test(otp)) {
            Swal.showValidationMessage('OTP harus 6 digit');
            return null;
          }
          return otp;
        },
      });
      if (!swalRes.isConfirmed) return;

      const otp = String(swalRes.value ?? '');
      const updateRes = await api.post<unknown>(
        '/profile/update-password',
        {
          otp,
          current_password: form.existingPassword,
          existing_password: form.existingPassword,
          new_password: form.newPassword,
          password: form.newPassword,
          confirm_password: form.confirmPassword,
        },
        headers
      );
      if (updateRes.status === 'success') {
        await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Password berhasil diubah.' });
        navigate('/dashboard/partner/profile');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/partner/profile')} className="!w-auto !h-auto p-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ubah Password</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Perbarui password akun anda</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6" autoComplete="off">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 md:col-span-1 flex">
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Foto Profil</h2>
              </div>
              <div className="mt-3 h-px bg-gray-200" />
              <div className="flex flex-col items-center justify-center flex-1 min-h-[260px]">
                <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  {avatarPath ? (
                    <img src={toFileUrl(avatarPath)} alt="Foto Profil" className="h-full w-full object-cover" />
                  ) : (
                    <img src={defaultAvatar} alt="Foto Profil" className="h-16 w-16 object-contain opacity-80" />
                  )}
                </div>
                {loadingProfile ? <div className="mt-4 text-sm text-gray-600">Memuat...</div> : null}
              </div>
            </div>
          </div>

          <div
            className={[
              'bg-white rounded-lg shadow p-6 md:col-span-2',
              'transition-all duration-300',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
            ].join(' ')}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Ubah Password</h2>
            </div>
            <div className="mt-3 h-px bg-gray-200" />

            <div className="mt-4 w-full max-w-md space-y-4">
              <div>
                <label className="text-sm">Existing Password</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      ref={existingInputRef}
                      type={showExisting ? 'text' : 'password'}
                      name="existing_password"
                      value={form.existingPassword}
                      onChange={(e) => setForm((p) => ({ ...p, existingPassword: e.target.value }))}
                      className={`h-12 pr-10 ${errors.existingPassword ? 'border-red-500' : ''}`}
                      placeholder="Masukkan password lama"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowExisting((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent"
                    >
                      {showExisting ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="w-6 h-6 flex items-center justify-center">
                    {existingStatus === 'valid' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : existingStatus === 'invalid' ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : existingStatus === 'checking' ? (
                      <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                    ) : null}
                  </div>
                </div>
                {existingStatus === 'valid' ? (
                  <p className="text-sm text-green-600 mt-1">{existingMessage || 'Password sesuai'}</p>
                ) : existingStatus === 'invalid' && form.existingPassword.length >= 6 ? (
                  <p className="text-sm text-red-600 mt-1">{existingMessage || 'Password tidak sesuai'}</p>
                ) : errors.existingPassword ? (
                  <p className="text-sm text-red-600 mt-1">{errors.existingPassword}</p>
                ) : null}
              </div>

              <div>
                <label className="text-sm">New Password</label>
                <div className="relative">
                  <Input
                    type={showNew ? 'text' : 'password'}
                    name="new_password"
                    value={form.newPassword}
                    onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                    className={`h-12 pr-10 ${errors.newPassword ? 'border-red-500' : ''}`}
                    placeholder="Masukkan password baru"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-1 text-xs text-gray-600">
                  Kekuatan password:{' '}
                  <span className={`font-semibold ${strengthColor(strength.label)}`}>{strength.label}</span>
                </div>
                {errors.newPassword ? <p className="text-sm text-red-600 mt-1">{errors.newPassword}</p> : null}
              </div>

              <div>
                <label className="text-sm">Confirm Password</label>
                <div className="relative">
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirm_password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    disabled={!existingValid}
                    className={`h-12 pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    placeholder="Ulangi password baru"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    disabled={!existingValid}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword ? <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving || !existingValid} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? (
              <span className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Proses Validasi...
              </span>
            ) : (
              'Simpan Perubahan'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
