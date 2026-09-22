import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { SAAS_PRODUCT_CONFIG, COMPANY_CONFIG } from '@/config/product';
import {
  Building2,
  LayoutDashboard,
  Sparkles,
} from 'lucide-react';
import { RegisterForm } from './RegisterForm';

export const metadata: Metadata = {
  title: `Daftar Instansi — ${SAAS_PRODUCT_CONFIG.name}`,
  description: `Pendaftaran tenant instansi pesantren baru pada platform cloud ${SAAS_PRODUCT_CONFIG.name}.`,
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-stone-950 font-sans text-stone-100 antialiased selection:bg-emerald-500 selection:text-white flex flex-col justify-between">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <header className="w-full border-b border-stone-800/80 bg-stone-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/30 border border-emerald-400/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white block leading-none">
                {SAAS_PRODUCT_CONFIG.name}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
                SaaS Multi-Tenant Cloud
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-200 hover:text-white bg-stone-900 hover:bg-stone-850 border border-stone-800 transition flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Masuk Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Main Content Area (Mobile-First Container) ─────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        <div className="w-full max-w-xl md:max-w-2xl space-y-6 sm:space-y-8">
          {/* Badge & Title */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pendaftaran Instansi Baru</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              Daftar Instansi Pesantren
            </h1>
            <p className="text-stone-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              Mulai langkah digitalisasi tata kelola pesantren Anda dalam satu platform terpadu. Lengkapi formulir pendaftaran di bawah ini.
            </p>
          </div>

          {/* Functional Mobile-First Registration Form */}
          <RegisterForm />
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="py-6 border-t border-stone-900 text-center text-xs text-stone-500">
        <p>© 2026 {SAAS_PRODUCT_CONFIG.name}. {COMPANY_CONFIG.attribution}</p>
      </footer>
    </div>
  );
}

