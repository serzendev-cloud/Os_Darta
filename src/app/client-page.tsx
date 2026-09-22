'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { GraduationCap, Loader2, Mail, Lock, LogIn, Building2, Sparkles, ShieldCheck, UserCheck, Check } from 'lucide-react';
import Image from 'next/image';

interface LoginClientProps {
  tenantName: string;
  loginTitle: string;
  loginSubtitle: string;
  loginDescription: string;
  customLogoUrl?: string | null;
}

export default function LoginClient({ 
  tenantName, 
  loginTitle, 
  loginSubtitle, 
  loginDescription,
  customLogoUrl
}: LoginClientProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { login } = useAuthStore();
  // Pre-fill remembered email from localStorage asynchronously to avoid cascading renders
  useEffect(() => {
    const timer = setTimeout(() => {
      const savedEmail = localStorage.getItem('madev_remember_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setLoginError('Email dan kata sandi wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    // Save or clear remembered email based on checkbox state
    if (rememberMe) {
      localStorage.setItem('madev_remember_email', trimmedEmail);
    } else {
      localStorage.removeItem('madev_remember_email');
    }

    const success = await login(trimmedEmail, password);
    setIsSubmitting(false);

    if (success) {
      // Safe internal redirect extraction (Prevent Open Redirect attacks)
      let destination = '/dashboard';
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const candidateRedirect = params.get('redirect');
        if (
          candidateRedirect &&
          candidateRedirect.startsWith('/') &&
          !candidateRedirect.startsWith('//') &&
          !candidateRedirect.includes('://')
        ) {
          destination = candidateRedirect;
        }
      }
      router.push(destination);
      router.refresh();
    } else {
      const err = useAuthStore.getState().error;
      setLoginError(err || 'Login gagal. Periksa email dan password.');
    }
  };

  const [previewLoadingRole, setPreviewLoadingRole] = useState<string | null>(null);

  // Production / Standard UI: Preview Platform is managed inside Super Admin SaaS Console (/dashboard/saas/preview).
  // Public login page is kept clean (Email & Password) per Product Owner directive.
  // Can be optionally toggled in local dev only if NEXT_PUBLIC_SHOW_LOGIN_PREVIEW_BUTTONS === 'true'.
  const isPreviewUiEnabled = process.env.NEXT_PUBLIC_SHOW_LOGIN_PREVIEW_BUTTONS === 'true';

  // Dedicated Role Preview Configuration (Development / Evaluation Only)
  const previewRoles = [
    { role: 'developer', label: 'Developer / Owner', badge: '👑 Developer', color: 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 hover:border-rose-300' },
    { role: 'super_admin', label: 'Super Admin Platform', badge: '🛡 Super Admin', color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300' },
    { role: 'admin', label: 'Admin Pesantren', badge: '🏫 Admin', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300' },
    { role: 'musyrif', label: 'Musyrif Asrama', badge: '🕌 Musyrif', color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300' },
    { role: 'wali', label: 'Wali Santri', badge: '👨‍👩‍👧 Wali', color: 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100 hover:border-teal-300' },
    { role: 'santri', label: 'Santri', badge: '🎓 Santri', color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300' },
  ];

  const handleRolePreview = async (targetRole: string) => {
    setLoginError('');
    setPreviewLoadingRole(targetRole);

    try {
      const res = await fetch('/api/auth/role-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.error || 'Gagal memulai sesi role preview.');
        setPreviewLoadingRole(null);
        return;
      }

      // Synchronize client auth store with returned session
      if (data.session) {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        useAuthStore.getState().syncUser(data.session.user);
      }

      router.push(data.redirectTo || '/dashboard');
      router.refresh();
    } catch (err: unknown) {
      setLoginError((err as Error).message || 'Terjadi kesalahan saat memproses role preview.');
      setPreviewLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex font-sans antialiased">

      {/* Left — Company & Institution Banner (Desktop) */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 flex-col justify-between p-12 relative overflow-hidden text-white shadow-2xl">
        {/* Background decorative glows */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(52,211,153,0.15),transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl" />

        {/* Top Header: Company Identity & Institution Badge */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            {/* Company Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-emerald-100 text-xs font-medium shadow-sm">
              <Building2 className="w-4 h-4 text-emerald-300" />
              <span className="font-semibold text-white">Serene Zeith Corp</span>
              <span className="text-white/40">•</span>
              <span className="text-emerald-200">serzen_dev</span>
            </div>

            {/* Product Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Madev Platform</span>
            </div>
          </div>

          {/* Institution Header */}
          <div className="flex items-center gap-4 pt-4 border-t border-white/10">
            {customLogoUrl ? (
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md p-1 border border-white/20 shadow-lg flex items-center justify-center overflow-hidden shrink-0">
                <Image 
                  src={customLogoUrl} 
                  alt={loginTitle} 
                  width={56} 
                  height={56} 
                  className="object-contain w-full h-full rounded-xl"
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-950/50 shrink-0">
                <div className="w-full h-full bg-emerald-950/80 rounded-[14px] flex items-center justify-center backdrop-blur-sm">
                  <GraduationCap className="w-7 h-7 text-emerald-300" />
                </div>
              </div>
            )}

            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">{loginTitle}</h1>
              <p className="text-emerald-200 text-xs font-medium">{loginSubtitle}</p>
            </div>
          </div>
        </div>

        {/* Center Content: Product Title & Description */}
        <div className="relative z-10 space-y-4 my-8">
          <div className="inline-flex items-center gap-2 text-emerald-300 text-xs font-semibold tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Sistem Informasi Pesantren Terpadu
          </div>
          <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
            Madev — <span className="text-emerald-300">Ma&apos;had Manager</span>
          </h2>
          <p className="text-emerald-100/90 text-sm max-w-lg leading-relaxed font-normal">
            {loginDescription}
          </p>

          <div className="pt-4 grid grid-cols-2 gap-3 max-w-md">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="text-emerald-300 font-semibold text-xs">Akademik & Santri</div>
              <div className="text-white/70 text-[11px] mt-0.5">Manajemen data & karakter santri</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="text-emerald-300 font-semibold text-xs">Absensi & RFID</div>
              <div className="text-white/70 text-[11px] mt-0.5">Presensi digital & wali gateway</div>
            </div>
          </div>
        </div>

        {/* Bottom Company Branding Footer */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex flex-col gap-1.5 text-xs">
          <div className="flex items-center justify-between text-emerald-200 font-medium">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Serene Zeith Corp</span>
              <span className="text-emerald-400/50">|</span>
              <span className="text-emerald-300">Devisi: serzen_dev</span>
              <span className="text-emerald-400/50">|</span>
              <span className="text-emerald-300">Produk: Madev</span>
            </div>
          </div>
          <p className="text-emerald-300/60 text-[11px]">
            &copy; {new Date().getFullYear()} {tenantName || 'Serene Zeith Corp'}. Seluruh hak cipta dilindungi.
          </p>
        </div>
      </div>

      {/* Right — Form Login */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative bg-stone-50">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 md:p-10 border border-stone-200/80 shadow-xl shadow-stone-200/50">

          {/* Top Company Header (Visible on Desktop & Mobile) */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-stone-100">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Serene Zeith Corp</span>
              <span className="text-emerald-300">•</span>
              <span className="text-emerald-700">serzen_dev</span>
            </div>
            <span className="text-[11px] font-bold tracking-wider text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded uppercase">
              Madev
            </span>
          </div>

          {/* Mobile branding header */}
          <div className="lg:hidden text-center mb-6 space-y-2">
            {customLogoUrl ? (
              <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 p-1 flex items-center justify-center">
                <Image src={customLogoUrl} alt={loginTitle} width={64} height={64} className="object-contain rounded-xl" />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
                <GraduationCap className="w-7 h-7" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-stone-900">{loginTitle}</h1>
              <p className="text-stone-500 text-xs">{loginSubtitle}</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Selamat Datang</h2>
            <p className="text-stone-500 text-sm mt-1">Silakan masuk ke portal manajemen <span className="font-semibold text-emerald-700">Madev</span></p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Email Pengguna
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@mahad.sch.id"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium"
                  required
                />
              </div>
            </div>

            {/* Checkbox Simpan Akun / Ingat Saya */}
            <div className="flex items-center justify-between py-1">
              <label className="flex items-center gap-2.5 text-xs text-stone-600 font-medium cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500/30 accent-emerald-600 cursor-pointer transition-all"
                />
                <span className="group-hover:text-stone-900 transition-colors flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Simpan & ingat akun di perangkat ini
                </span>
              </label>
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-600 font-medium">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl py-3 px-4 text-sm transition-all shadow-md shadow-emerald-700/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {isSubmitting ? 'Memproses Login...' : 'Masuk ke Sistem'}
            </button>
          </form>

          {/* Role Preview Engine (Controlled Display: Active in dev by default, explicit opt-in in prod) */}
          {isPreviewUiEnabled && (
            <div className="mt-6 pt-5 border-t border-stone-200">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Preview Platform Berdasarkan Role</span>
                </p>
                <span className="text-[9px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                  Dev / Staging Preview
                </span>
              </div>
              <p className="text-[10px] text-stone-500 mb-2.5">
                Klik salah satu role untuk langsung masuk dan mengeksplorasi antarmuka platform dari sudut pandang peran tersebut:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {previewRoles.map((pr) => {
                  const isLoadingThis = previewLoadingRole === pr.role;
                  return (
                    <button
                      key={pr.role}
                      type="button"
                      disabled={isSubmitting || !!previewLoadingRole}
                      onClick={() => handleRolePreview(pr.role)}
                      className={`px-2 py-2 rounded-lg border text-[11px] font-semibold transition-all flex flex-col items-center justify-center gap-0.5 text-center ${pr.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoadingThis ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin my-0.5" />
                      ) : (
                        <>
                          <span className="text-xs">{pr.badge}</span>
                          <span className="text-[9.5px] opacity-80">{pr.label.split(' ')[0]}</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Footer inside form card */}
          <div className="mt-6 pt-5 border-t border-stone-100 text-center space-y-1">
            <p className="text-stone-600 text-xs font-semibold">
              Company: <span className="text-emerald-700 font-bold">Serene Zeith Corp</span> | Divisi: <span className="text-stone-800 font-medium">serzen_dev</span>
            </p>
            <p className="text-stone-400 text-[11px]">
              Produk: Madev Platform &copy; {new Date().getFullYear()} {tenantName || 'Serene Zeith Corp'}.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
