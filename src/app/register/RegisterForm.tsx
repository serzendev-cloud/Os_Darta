'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Globe,
  User,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { getTenantRootDomain } from '@/config/tenant';

interface FormState {
  name: string;
  slug: string;
  location: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
}

interface SuccessData {
  tenantName: string;
  tenantSlug: string;
  domain: string;
  ownerEmail: string;
}

export function RegisterForm() {
  const [formData, setFormData] = useState<FormState>({
    name: '',
    slug: '',
    location: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  // Helper to auto-suggest slug when user types name (if slug hasn't been manually customized)
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData((prev) => {
      const updated = { ...prev, name: newName };
      if (!isSlugManuallyEdited) {
        // Auto slugify
        const suggestedSlug = newName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 40);
        updated.slug = suggestedSlug;
      }
      return updated;
    });

    if (fieldErrors.name) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.name;
        return next;
      });
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManuallyEdited(true);
    const sanitizedSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData((prev) => ({ ...prev, slug: sanitizedSlug }));

    if (fieldErrors.slug) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.slug;
        return next;
      });
    }
  };

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: val }));

    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateClient = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.trim().length < 3) {
      errors.name = 'Nama instansi pesantren wajib diisi minimal 3 karakter.';
    }

    if (!formData.slug.trim()) {
      errors.slug = 'Subdomain / Slug wajib diisi.';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug) || formData.slug.length < 3 || formData.slug.length > 50) {
      errors.slug = 'Subdomain harus 3-50 karakter huruf kecil, angka, atau tanda hubung (-).';
    }

    if (!formData.ownerName.trim() || formData.ownerName.trim().length < 2) {
      errors.ownerName = 'Nama pengurus / penanggung jawab wajib diisi minimal 2 karakter.';
    }

    if (!formData.ownerEmail.trim()) {
      errors.ownerEmail = 'Alamat email wajib diisi.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.ownerEmail.trim())) {
      errors.ownerEmail = 'Format alamat email tidak valid.';
    }

    if (formData.ownerPhone && formData.ownerPhone.trim().length < 8) {
      errors.ownerPhone = 'Nomor telepon / WhatsApp minimal 8 digit.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateClient()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/saas/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          location: formData.location.trim() || undefined,
          ownerName: formData.ownerName.trim(),
          ownerEmail: formData.ownerEmail.trim().toLowerCase(),
          ownerPhone: formData.ownerPhone.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.field) {
          setFieldErrors({ [data.field]: data.message || 'Data tidak valid.' });
        }
        setGeneralError(data.message || 'Pendaftaran gagal diproses. Silakan periksa kembali data Anda.');
        return;
      }

      // Success
      setSuccessData({
        tenantName: data.data.tenantName,
        tenantSlug: data.data.tenantSlug,
        domain: data.data.domain,
        ownerEmail: data.data.ownerEmail,
      });
    } catch {
      setGeneralError('Gagal menghubungi server pendaftaran. Silakan periksa koneksi internet Anda dan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success State ──────────────────────────────────────────────────────────
  if (successData) {
    return (
      <div className="w-full p-6 sm:p-8 md:p-10 rounded-3xl bg-stone-900/90 border border-emerald-500/30 shadow-2xl shadow-emerald-950/20 text-left space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
              Pendaftaran Berhasil
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {successData.tenantName}
            </h2>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-3 text-xs sm:text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-stone-800/80 pb-2.5">
            <span className="text-stone-400">Subdomain Instansi:</span>
            <span className="font-mono font-semibold text-emerald-400 break-all">
              https://{successData.domain}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-stone-800/80 pb-2.5">
            <span className="text-stone-400">Email Administrator:</span>
            <span className="font-medium text-stone-200">{successData.ownerEmail}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-stone-400">Status Akun:</span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instansi Terdaftar (Onboarding)</span>
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-stone-300 leading-relaxed space-y-2">
          <p className="font-semibold text-emerald-300">Langkah Selanjutnya:</p>
          <p>
            Akun instansi dan hak akses administrator telah berhasil dibuat di database cloud. Konfigurasi awal dan aktivasi kata sandi administrator akan dipandu melalui alur aktivasi onboarding resmi.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <Link
            href="/login"
            className="w-full min-h-[44px] py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-sm shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition"
          >
            <span>Sudah Memiliki Akun? Masuk Portal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/"
            className="w-full min-h-[44px] py-3 px-6 rounded-2xl bg-stone-850 hover:bg-stone-800 border border-stone-750 text-stone-300 hover:text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Halaman Utama</span>
          </Link>
        </div>
      </div>
    );
  }

  // ── Registration Form ──────────────────────────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full p-5 sm:p-8 md:p-10 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-2xl shadow-black/60 space-y-6 text-left"
    >
      {generalError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3 text-rose-300 text-xs sm:text-sm leading-relaxed"
        >
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-200">Perhatian:</p>
            <p>{generalError}</p>
          </div>
        </div>
      )}

      {/* ── Field 1: Nama Instansi ────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label htmlFor="reg-name" className="block text-xs sm:text-sm font-semibold text-stone-200">
          Nama Pesantren / Instansi <span className="text-emerald-400">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
            <Building2 className="w-4 h-4" />
          </div>
          <input
            id="reg-name"
            type="text"
            required
            value={formData.name}
            onChange={handleNameChange}
            placeholder="Contoh: Pondok Pesantren Darul Ulum"
            className={`w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-950/80 border text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 transition ${
              fieldErrors.name
                ? 'border-rose-500/80 focus:ring-rose-500/40'
                : 'border-stone-800 focus:border-emerald-500 focus:ring-emerald-500/20'
            }`}
          />
        </div>
        {fieldErrors.name && (
          <p className="text-xs text-rose-400 font-medium pl-1">{fieldErrors.name}</p>
        )}
      </div>

      {/* ── Field 2: Subdomain / Slug ─────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label htmlFor="reg-slug" className="block text-xs sm:text-sm font-semibold text-stone-200">
          Subdomain Akses Pesantren <span className="text-emerald-400">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
            <Globe className="w-4 h-4" />
          </div>
          <input
            id="reg-slug"
            type="text"
            required
            value={formData.slug}
            onChange={handleSlugChange}
            placeholder="darululum"
            className={`w-full min-h-[44px] pl-10 pr-32 py-2.5 rounded-xl bg-stone-950/80 border font-mono text-sm text-emerald-400 placeholder-stone-600 focus:outline-none focus:ring-2 transition ${
              fieldErrors.slug
                ? 'border-rose-500/80 focus:ring-rose-500/40'
                : 'border-stone-800 focus:border-emerald-500 focus:ring-emerald-500/20'
            }`}
          />
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-stone-500 font-mono text-xs">
            .{getTenantRootDomain()}
          </div>
        </div>
        {/* Live Subdomain Preview */}
        <p className="text-[11px] text-stone-400 pl-1">
          Alamat portal:{' '}
          <span className="font-mono text-emerald-400 font-medium">
            https://{formData.slug ? formData.slug : 'subdomain'}.{getTenantRootDomain()}
          </span>
        </p>
        {fieldErrors.slug && (
          <p className="text-xs text-rose-400 font-medium pl-1">{fieldErrors.slug}</p>
        )}
      </div>

      {/* ── Field 3: Nama Penanggung Jawab ────────────────────────────────── */}
      <div className="space-y-1.5">
        <label htmlFor="reg-owner-name" className="block text-xs sm:text-sm font-semibold text-stone-200">
          Nama Penanggung Jawab / Pendaftar <span className="text-emerald-400">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
            <User className="w-4 h-4" />
          </div>
          <input
            id="reg-owner-name"
            type="text"
            required
            value={formData.ownerName}
            onChange={handleChange('ownerName')}
            placeholder="Contoh: KH. Ahmad Dahlan"
            className={`w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-950/80 border text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 transition ${
              fieldErrors.ownerName
                ? 'border-rose-500/80 focus:ring-rose-500/40'
                : 'border-stone-800 focus:border-emerald-500 focus:ring-emerald-500/20'
            }`}
          />
        </div>
        {fieldErrors.ownerName && (
          <p className="text-xs text-rose-400 font-medium pl-1">{fieldErrors.ownerName}</p>
        )}
      </div>

      {/* ── Field 4: Email Pengurus ───────────────────────────────────────── */}
      <div className="space-y-1.5">
        <label htmlFor="reg-email" className="block text-xs sm:text-sm font-semibold text-stone-200">
          Alamat Email Resmi Administrator <span className="text-emerald-400">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
            <Mail className="w-4 h-4" />
          </div>
          <input
            id="reg-email"
            type="email"
            required
            value={formData.ownerEmail}
            onChange={handleChange('ownerEmail')}
            placeholder="admin@pesantren.sch.id"
            className={`w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-950/80 border text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 transition ${
              fieldErrors.ownerEmail
                ? 'border-rose-500/80 focus:ring-rose-500/40'
                : 'border-stone-800 focus:border-emerald-500 focus:ring-emerald-500/20'
            }`}
          />
        </div>
        {fieldErrors.ownerEmail && (
          <p className="text-xs text-rose-400 font-medium pl-1">{fieldErrors.ownerEmail}</p>
        )}
      </div>

      {/* ── Grid: Telepon & Lokasi (Responsive Two Columns on md+) ───────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Field 5: WhatsApp / Telepon */}
        <div className="space-y-1.5">
          <label htmlFor="reg-phone" className="block text-xs sm:text-sm font-semibold text-stone-200">
            Nomor Telepon / WhatsApp
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
              <Phone className="w-4 h-4" />
            </div>
            <input
              id="reg-phone"
              type="tel"
              value={formData.ownerPhone}
              onChange={handleChange('ownerPhone')}
              placeholder="081234567890"
              className={`w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-950/80 border text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:ring-2 transition ${
                fieldErrors.ownerPhone
                  ? 'border-rose-500/80 focus:ring-rose-500/40'
                  : 'border-stone-800 focus:border-emerald-500 focus:ring-emerald-500/20'
              }`}
            />
          </div>
          {fieldErrors.ownerPhone && (
            <p className="text-xs text-rose-400 font-medium pl-1">{fieldErrors.ownerPhone}</p>
          )}
        </div>

        {/* Field 6: Kota / Wilayah Lokasi */}
        <div className="space-y-1.5">
          <label htmlFor="reg-location" className="block text-xs sm:text-sm font-semibold text-stone-200">
            Kota / Kabupaten Lokasi
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              id="reg-location"
              type="text"
              value={formData.location}
              onChange={handleChange('location')}
              placeholder="Malang, Jawa Timur"
              className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-950/80 border border-stone-800 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            />
          </div>
        </div>
      </div>

      {/* ── Submit Action ─────────────────────────────────────────────────── */}
      <div className="pt-2 space-y-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[46px] py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-stone-950 font-bold text-sm sm:text-base shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
              <span>Memproses Pendaftaran...</span>
            </>
          ) : (
            <>
              <span>Daftarkan Instansi Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-stone-400">
          <Link
            href="/login"
            className="hover:text-emerald-400 transition underline underline-offset-4"
          >
            Sudah Memiliki Akun? Masuk Portal
          </Link>
          <Link
            href="/"
            className="hover:text-stone-200 transition flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Kembali ke Halaman Utama</span>
          </Link>
        </div>
      </div>

      {/* ── Security Trust Badge ──────────────────────────────────────────── */}
      <div className="pt-2 border-t border-stone-800/60 flex items-center justify-center gap-2 text-[11px] text-stone-500">
        <ShieldCheck className="w-4 h-4 text-emerald-400/80 shrink-0" />
        <span>Data Instansi Terisolasi & Terlindungi (Supabase Multi-Tenant RLS)</span>
      </div>
    </form>
  );
}
