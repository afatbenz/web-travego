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

const INPUT_CLS =
  'h-14 rounded-2xl border-slate-200 bg-slate-50 transition-all duration-300 focus-visible:ring-4 focus-visible:ring-blue-100 dark:border-slate-700 dark:bg-slate-900/50';

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
        navigate('/dashboard/profile');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => navigate('/dashboard/profile')}
            className="h-10 w-10 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Ubah Password</h1>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1">Perbarui password akun anda</p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmit} autoComplete="off">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr] xl:gap-8">
          <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-200/60 transition-all duration-300 hover:border-blue-100 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Foto Profil</h2>
              <p className="mt-1 text-xs text-slate-500">Pratinjau foto profil Anda</p>

              <div className="mt-5 flex flex-col items-center">
                <div className="h-36 w-36 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200/70 dark:ring-slate-700 flex items-center justify-center">
                  {avatarPath ? (
                    <img src={toFileUrl(avatarPath)} alt="Foto Profil" className="h-full w-full object-cover" />
                  ) : (
                    <img src={defaultAvatar} alt="Foto Profil" className="h-16 w-16 object-contain opacity-80" />
                  )}
                </div>
                {loadingProfile ? <div className="mt-4 text-xs text-slate-500">Memuat...</div> : null}
              </div>
            </div>
          </aside>

          <div
            className={[
              'rounded-3xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-200/60 transition-all duration-300 sm:p-8 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none lg:p-10',
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
            ].join(' ')}
          >
            <div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white">Ubah Password</div>
              <p className="mt-1 text-sm text-slate-500">Pastikan password baru kuat dan mudah Anda ingat</p>
            </div>

            <div className="mt-8 w-full max-w-md space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Existing Password</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Input
                      ref={existingInputRef}
                      type={showExisting ? 'text' : 'password'}
                      name="existing_password"
                      value={form.existingPassword}
                      onChange={(e) => setForm((p) => ({ ...p, existingPassword: e.target.value }))}
                      className={[INPUT_CLS, 'pr-11', errors.existingPassword ? 'border-red-500' : ''].join(' ')}
                      placeholder="Masukkan password lama"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={() => setShowExisting((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent"
                    >
                      {showExisting ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="w-7 h-7 flex items-center justify-center">
                    {existingStatus === 'valid' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : existingStatus === 'invalid' ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : existingStatus === 'checking' ? (
                      <Loader2 className="h-5 w-5 text-slate-400 animate-spin" />
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                <div className="relative">
                  <Input
                    type={showNew ? 'text' : 'password'}
                    name="new_password"
                    value={form.newPassword}
                    onChange={(e) => setForm((p) => ({ ...p, newPassword: e.target.value }))}
                    className={[INPUT_CLS, 'pr-11', errors.newPassword ? 'border-red-500' : ''].join(' ')}
                    placeholder="Masukkan password baru"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="text-xs text-slate-500">
                  Kekuatan password: <span className={`font-semibold ${strengthColor(strength.label)}`}>{strength.label}</span>
                </div>
                {errors.newPassword ? <p className="text-sm text-red-600 mt-1">{errors.newPassword}</p> : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
                <div className="relative">
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirm_password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    disabled={!existingValid}
                    className={[INPUT_CLS, 'pr-11', errors.confirmPassword ? 'border-red-500' : ''].join(' ')}
                    placeholder="Ulangi password baru"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    disabled={!existingValid}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-transparent disabled:opacity-40"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword ? <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p> : null}
              </div>
            </div>

            <div className="mt-10 flex justify-end">
              <Button type="submit" disabled={saving || !existingValid} className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white px-6">
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
          </div>
        </div>
      </form>
    </div>
  );
};
