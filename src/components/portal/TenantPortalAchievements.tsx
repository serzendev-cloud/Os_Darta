'use client';

import React from 'react';
import { Trophy, Star, ShieldCheck, HeartHandshake, CheckCircle2 } from 'lucide-react';
import type { TenantContext } from '@/lib/tenant/context';

interface AchievementsProps {
  tenant: TenantContext;
}

export function TenantPortalAchievements({ tenant }: AchievementsProps) {
  const primaryColor = tenant.settings?.primaryColor || '#0F766E';

  const achievements = [
    {
      title: 'Juara MQK (Musabaqah Qira\'atil Kutub)',
      category: 'Prestasi Akademik Diniyah',
      desc: 'Meraih peringkat terbaik dalam perlombaan baca dan pemahaman kitab kuning tingkat wilayah.',
    },
    {
      title: 'Kelulusan PTN & Madinah University',
      category: 'Prestasi Alumni',
      desc: 'Alumni tersebar di Perguruan Tinggi Negeri terkemuka serta Universitas Islam Madinah & Al-Azhar Kairo.',
    },
    {
      title: 'Sertifikasi Tahfidz 30 Juz',
      category: 'Capaian Santri',
      desc: 'Puluhan santri menyelesaikan hafalan 30 juz setiap tahun dengan predikat Jayyid Jiddan / Mumtaz.',
    },
  ];

  return (
    <section id="prestasi" className="py-16 sm:py-24 bg-slate-900 text-white border-b border-slate-800 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Prestasi & Kualitas</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Komitmen Keunggulan <span className="text-emerald-400">{tenant.name}</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Bukti nyata dedikasi santri dan ustadz dalam meraih prestasi akademik, hafalan, serta pembentukan karakter rabbani.
          </p>
        </div>

        {/* Achievements Cards */}
        <div className="mt-12 sm:mt-16 grid md:grid-cols-3 gap-8">
          {achievements.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-800/80 rounded-3xl p-6 sm:p-8 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800 transition-all duration-300 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  {item.category}
                </span>
                <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-white">
                {item.title}
              </h3>

              <p className="text-sm text-slate-300 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
