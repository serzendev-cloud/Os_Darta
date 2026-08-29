'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, LogIn, Award, BookOpen, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import type { TenantContext } from '@/lib/tenant/context';

interface HeroProps {
  tenant: TenantContext;
}

export function TenantPortalHero({ tenant }: HeroProps) {
  const primaryColor = tenant.settings?.primaryColor || '#0F766E';
  const logoUrl = tenant.settings?.customLogoUrl;
  const subtitle = tenant.settings?.loginSubtitle || 'Lembaga Pendidikan & Pesantren Terpadu';
  const tagline = tenant.settings?.tagline || 'Membentuk Generasi Rabbani Berakhlak Mulia dan Berwawasan Global';

  return (
    <section id="hero" className="relative overflow-hidden bg-slate-900 text-white pt-12 pb-20 sm:pt-20 sm:pb-28 lg:pb-32">
      {/* Background Subtle Gradient Overlay */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-400 via-emerald-600 to-slate-950" 
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Main Info */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-semibold text-teal-300">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Portal Resmi {tenant.name}</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight sm:leading-none">
              Selamat Datang di <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
                {tenant.name}
              </span>
            </h1>

            {/* Subtitle & Tagline */}
            <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              {tagline}
            </p>

            {/* Key Value Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2 text-xs sm:text-sm text-slate-300 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Pendidikan Formal & Diniyah</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Program Tahfidz Al-Qur'an</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Sistem Terintegrasi Digital</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <a
                href="#profil"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-500/20 transition-all min-h-[44px] active:scale-95 text-base"
              >
                <span>Jelajahi Profil</span>
                <ArrowRight className="w-5 h-5" />
              </a>

              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all min-h-[44px] active:scale-95 text-base backdrop-blur-sm"
              >
                <LogIn className="w-5 h-5 text-emerald-400" />
                <span>Masuk Portal Tenant</span>
              </Link>
            </div>
          </div>

          {/* Right Hero Visual Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative space-y-6">
              
              {/* Card Header Logo */}
              <div className="flex items-center gap-4 border-b border-slate-700/60 pb-6">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={tenant.name}
                    className="w-16 h-16 object-contain rounded-2xl border border-slate-600 bg-white p-1.5 shadow-md"
                  />
                ) : (
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <BookOpen className="w-8 h-8" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg text-white">{tenant.name}</h3>
                  <p className="text-xs text-emerald-400 font-semibold">{subtitle}</p>
                </div>
              </div>

              {/* Quick Info Items */}
              <div className="space-y-4 text-xs sm:text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-800 text-teal-400 border border-slate-700">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Akreditasi & Kualitas</h4>
                    <p className="text-slate-400">Kurikulum terpadu nasional & pesantren berbasis sains & Al-Qur'an.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Sistem Keamanan & Asrama</h4>
                    <p className="text-slate-400">Presensi digital RFID, pemantauan pengasuhan, & kesehatan santri 24 jam.</p>
                  </div>
                </div>
              </div>

              {/* Action Banner */}
              <div className="pt-2">
                <Link
                  href="/login"
                  className="flex items-center justify-between p-4 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 transition-all text-xs text-emerald-200 font-medium group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Wali / Santri / Pengajar Login</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
