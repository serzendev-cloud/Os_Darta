'use client';

// =============================================================================
// EEOS Password Recovery Request Client View
// Traceability: WP-AUTH-PASSWORD-RESET-FLOW-001
// =============================================================================

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, ArrowLeft, Loader2, CheckCircle2, ShieldAlert, KeyRound, Building2 } from 'lucide-react';
import Image from 'next/image';

interface ForgotPasswordClientProps {
  tenantName?: string;
  loginTitle?: string;
  customLogoUrl?: string | null;
}

export default function ForgotPasswordClient({
  tenantName,
  loginTitle,
  customLogoUrl,
}: ForgotPasswordClientProps) {
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  let initialErrorBanner = '';
  if (urlError === 'invalid_or_expired_link') {
    initialErrorBanner = 'Tautan pemulihan kata sandi tidak valid atau telah kedaluwarsa. Silakan ajukan instruksi baru.';
  } else if (urlError === 'session_required') {
    initialErrorBanner = 'Sesi pemulihan tidak ditemukan atau telah kedaluwarsa. Silakan ajukan instruksi baru.';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Silakan masukkan alamat email Anda.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMessage(data?.error || 'Terjadi kesalahan saat memproses permintaan.');
        setIsSubmitting(false);
        return;
      }

      // Success (whether email exists or not, preserving enumeration protection)
      setIsSubmitted(true);
    } catch {
      setErrorMessage('Terjadi gangguan jaringan. Silakan periksa koneksi Anda dan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayName = loginTitle || tenantName || "Ma'had Manager";

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-4">
      <div className="max-w-md w-full bg-white dark:bg-stone-900 rounded-3xl shadow-xl border border-stone-200 dark:border-stone-800 p-8 space-y-6 animate-in fade-in zoom-in-95">

        {/* Top Header / Branding */}
        <div className="text-center space-y-2">
          {customLogoUrl ? (
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/50 p-1 flex items-center justify-center mb-2">
              <Image src={customLogoUrl} alt={displayName} width={64} height={64} className="object-contain rounded-xl" />
            </div>
          ) : (
            <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
              <KeyRound className="w-8 h-8" />
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-xs font-medium">
            <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{displayName}</span>
          </div>

          <h1 className="text-2xl font-bold text-stone-900 dark:text-white tracking-tight">
            Lupa Password?
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-sm mx-auto">
            Masukkan email akun Anda. Jika email tersebut terdaftar, kami akan mengirimkan instruksi untuk membuat password baru.
          </p>
        </div>

        {/* URL Error Banner (e.g. from expired callback) */}
        {initialErrorBanner && !isSubmitted && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{initialErrorBanner}</span>
          </div>
        )}

        {/* State 1: Success Feedback (Enumeration-proof) */}
        {isSubmitted ? (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 text-center space-y-3">
              <div className="inline-flex p-2.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Instruksi Pemulihan Terkirim
              </h2>
              <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                Jika email tersebut terdaftar, instruksi pemulihan password telah dikirim. Silakan periksa email Anda.
              </p>
              <div className="text-[11px] text-stone-500 dark:text-stone-400 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40">
                Belum menerima email? Periksa folder spam atau ajukan kembali dalam beberapa saat.
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/login"
                className="w-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-semibold rounded-xl py-3 px-4 text-xs transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Halaman Login
              </Link>
            </div>
          </div>
        ) : (
          /* State 2: Request Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="recovery-email" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Email Pengguna
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                <input
                  id="recovery-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@mahad.sch.id"
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl pl-10 pr-4 py-3 text-sm text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium"
                  required
                  autoFocus
                />
              </div>
            </div>

            {errorMessage && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-3.5 text-xs text-red-600 dark:text-red-400 font-medium">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl py-3 px-4 text-sm transition-all shadow-md shadow-emerald-700/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              {isSubmitting ? 'Mengirim Instruksi...' : 'Kirim Instruksi Reset'}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Halaman Login
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
