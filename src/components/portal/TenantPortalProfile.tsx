'use client';

import React from 'react';
import { Building, ShieldCheck, Heart, Sparkles, BookOpen, Users, Compass } from 'lucide-react';
import type { TenantContext } from '@/lib/tenant/context';

interface ProfileProps {
  tenant: TenantContext;
}

export function TenantPortalProfile({ tenant }: ProfileProps) {
  const primaryColor = tenant.settings?.primaryColor || '#0F766E';
  const tagline = tenant.settings?.tagline || 'Sistem Informasi Pesantren Terpadu';
  const description = tenant.settings?.loginDescription || 'Platform pendidikan terpadu yang memadukan keunggulan akademik formal dengan kedalaman ilmu syar\'i dan hafalan Al-Qur\'an.';

  const features = [
    {
      title: 'Integrasi Kurikulum',
      desc: 'Pendidikan formal (Kemenag/Kemdikbud) dipadukan harmonis dengan kurikulum Diniyah & Tahfidz.',
      icon: BookOpen,
    },
    {
      title: 'Pengasuhan & Asrama',
      desc: 'Pendampingan santri 24 jam oleh Musyrif berpengalaman dengan penanaman kedisiplinan & akhlakul karimah.',
      icon: Compass,
    },
    {
      title: 'Digitalisasi Ma\'had',
      desc: 'Absensi RFID, rekam medis UKS, laporan perkembangan e-rapor, dan transparansi dompet digital santri.',
      icon: ShieldCheck,
    },
  ];

  return (
    <section id="profil" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Profil Lembaga</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Mengenal Lebih Dekat <span style={{ color: primaryColor }}>{tenant.name}</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Profile Grid Cards */}
        <div className="mt-12 sm:mt-16 grid md:grid-cols-3 gap-8">
          {features.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Institutional Stats Banner */}
        <div className="mt-12 sm:mt-16 bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <span className="text-2xl sm:text-4xl font-extrabold text-slate-900">100%</span>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Bimbingan Terpadu</p>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-4xl font-extrabold text-emerald-700">30 Juz</span>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Target Mutqin Tahfidz</p>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-4xl font-extrabold text-slate-900">24/7</span>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Layanan Pengasuhan</p>
          </div>
          <div className="space-y-1">
            <span className="text-2xl sm:text-4xl font-extrabold text-emerald-700">Real-Time</span>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Laporan Wali Santri</p>
          </div>
        </div>

      </div>
    </section>
  );
}
