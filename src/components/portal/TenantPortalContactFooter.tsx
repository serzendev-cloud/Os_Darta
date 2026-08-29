'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, LogIn, Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react';
import type { TenantContext } from '@/lib/tenant/context';

interface ContactFooterProps {
  tenant: TenantContext;
}

export function TenantPortalContactFooter({ tenant }: ContactFooterProps) {
  const primaryColor = tenant.settings?.primaryColor || '#0F766E';
  const subtitle = tenant.settings?.loginSubtitle || 'Lembaga Pendidikan Pesantren Terpadu';
  const tagline = tenant.settings?.tagline || 'Sistem Informasi Pesantren Terpadu';

  return (
    <footer id="kontak" className="bg-slate-950 text-slate-400 text-sm border-t border-slate-900">
      
      {/* Contact Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-12 gap-10">
          
          {/* Tenant Brand Summary */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              {tenant.settings?.customLogoUrl ? (
                <img
                  src={tenant.settings.customLogoUrl}
                  alt={tenant.name}
                  className="w-10 h-10 object-contain rounded-xl border border-slate-800 bg-white p-1"
                />
              ) : (
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Building2 className="w-5 h-5" />
                </div>
              )}
              <div>
                <h4 className="font-extrabold text-white text-lg">{tenant.name}</h4>
                <p className="text-xs text-emerald-400 font-semibold">{subtitle}</p>
              </div>
            </div>

            <p className="text-slate-400 leading-relaxed text-sm">
              {tagline} — Dedikasi dalam membina generasi rabbani, menghafal Al-Qur'an, dan menguasai ilmu pengetahuan modern.
            </p>

            <div className="pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md hover:bg-emerald-600 transition-all min-h-[44px]"
                style={{ backgroundColor: primaryColor }}
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Portal Aplikasi Tenant</span>
              </Link>
            </div>
          </div>

          {/* Quick Nav */}
          <div className="md:col-span-3 space-y-3">
            <h5 className="font-bold text-white text-base">Navigasi Portal</h5>
            <ul className="space-y-2 text-sm">
              <li><a href="#hero" className="hover:text-white transition-colors">Beranda</a></li>
              <li><a href="#profil" className="hover:text-white transition-colors">Profil Lembaga</a></li>
              <li><a href="#program" className="hover:text-white transition-colors">Program Pendidikan</a></li>
              <li><a href="#prestasi" className="hover:text-white transition-colors">Prestasi Santri</a></li>
              <li><a href="#informasi" className="hover:text-white transition-colors">Informasi & Pengumuman</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="md:col-span-4 space-y-3">
            <h5 className="font-bold text-white text-base">Hubungi Kami</h5>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-1" />
                <span>Sekretariat {tenant.name}, Indonesia</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Layanan Pengaduan & Informasi Pendaftaran</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>info@{tenant.slug}.mahad-app.com</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {tenant.name}. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Powered by Ma'had Manager ERP Platform</span>
          </div>
        </div>
      </div>

    </footer>
  );
}
