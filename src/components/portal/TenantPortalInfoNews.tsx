'use client';

import React from 'react';
import { Newspaper, Calendar, Bell, ChevronRight } from 'lucide-react';
import type { TenantContext } from '@/lib/tenant/context';

interface InfoNewsProps {
  tenant: TenantContext;
}

export function TenantPortalInfoNews({ tenant }: InfoNewsProps) {
  const primaryColor = tenant.settings?.primaryColor || '#0F766E';

  const announcements = [
    {
      date: 'Terbaru',
      title: 'Penerimaan Santri Baru (PSB) Tahun Ajaran Baru',
      category: 'Informasi Pendaftaran',
      desc: 'Pendaftaran gelombang pertama dibuka untuk jenjang MTs/SMP dan MA/SMA. Dapatkan informasi brosur & alur tes seleksi.',
    },
    {
      date: 'Pengumuman',
      title: 'Kalender Kegiatan Akademik & Imtihan Santri',
      category: 'Akademik',
      desc: 'Jadwal pelaksanaan Ujian Akhir Semester (UAS), Khotmil Qur\'an, dan libur perizinan pulang santri.',
    },
    {
      date: 'Wali Santri',
      title: 'Akses Portal & Dompet Digital Santri',
      category: 'Layanan Wali',
      desc: 'Panduan penggunaan aplikasi wali santri untuk pemantauan presensi RFID, rekam medis, dan pembayaran SPP.',
    },
  ];

  return (
    <section id="informasi" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
            <Bell className="w-3.5 h-3.5" />
            <span>Informasi & Berita</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Kabar Terbaru dari <span style={{ color: primaryColor }}>{tenant.name}</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Pemberitahuan resmi, pengumuman akademik, dan kegiatan santri bagi calon pendaftar maupun wali santri.
          </p>
        </div>

        {/* Info Grid */}
        <div className="mt-12 sm:mt-16 grid md:grid-cols-3 gap-8">
          {announcements.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {item.category}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {item.date}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {item.title}
                </h3>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
