'use client';

import React from 'react';
import { BookOpen, GraduationCap, Layers, Award, CheckCircle } from 'lucide-react';
import type { TenantContext } from '@/lib/tenant/context';

interface ProgramsProps {
  tenant: TenantContext;
}

export function TenantPortalPrograms({ tenant }: ProgramsProps) {
  const primaryColor = tenant.settings?.primaryColor || '#0F766E';

  const programsList = [
    {
      badge: 'Program Formal',
      title: 'Madrasah Tsanawiyah & Aliyah / SMP & SMA',
      desc: 'Kurikulum standar nasional dengan penekanan pada ilmu pengetahuan, matematika, bahasa asing (Arab & Inggris), serta teknologi.',
      icon: GraduationCap,
      highlights: ['Akreditasi Unggul', 'Laboratorium Komputer & Sains', 'Ekstrakurikuler Kepemimpinan'],
    },
    {
      badge: 'Program Keagamaan',
      title: 'Madrasah Diniyah & Kajian Kitab Kuning',
      desc: 'Pendalaman ilmu syar\'i seperti Fiqh, Aqidah, Hadits, Nahwu Shorof, dan Akhlak dari kitab-kitab turats bermutu.',
      icon: BookOpen,
      highlights: ['Metode Sorogan & Bandongan', 'Syahadah Diniyah', 'Praktik Imtihan Khotmil Kutub'],
    },
    {
      badge: 'Program Unggulan',
      title: 'Tahfidzul Qur\'an Mutqin',
      desc: 'Bimbingan hafalan Al-Qur\'an intensif dengan target mutqin, perbaikan tajwid/tahsin, dan bimbingan murojaah harian.',
      icon: Layers,
      highlights: ['Musyrif / Halaqah Khusus', 'Ujian Munaqosyah Berkala', 'Sanad Hafalan Al-Qur\'an'],
    },
  ];

  return (
    <section id="program" className="py-16 sm:py-24 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Program Pendidikan</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Program Unggulan di <span style={{ color: primaryColor }}>{tenant.name}</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Pilihan jenjang dan program pengasuhan yang dirancang khusus untuk membangun generasi yang seimbang antara ilmu agama dan keahlian zaman.
          </p>
        </div>

        {/* Programs Grid */}
        <div className="mt-12 sm:mt-16 grid lg:grid-cols-3 gap-8">
          {programsList.map((prog, idx) => {
            const IconComp = prog.icon;
            return (
              <div
                key={idx}
                className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {prog.badge}
                    </span>
                    <div className="p-2.5 rounded-2xl bg-white text-slate-700 shadow-xs border border-slate-200">
                      <IconComp className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 leading-snug">
                    {prog.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {prog.desc}
                  </p>

                  <div className="pt-2 space-y-2 border-t border-slate-200/60">
                    {prog.highlights.map((hl, hIdx) => (
                      <div key={hIdx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{hl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
