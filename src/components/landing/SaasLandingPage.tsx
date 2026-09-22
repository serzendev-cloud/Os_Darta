'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SAAS_PRODUCT_CONFIG, COMPANY_CONFIG } from '@/config/product';
import {
  ShieldCheck, Users, Layers, CreditCard, Stethoscope, Smartphone,
  Building2, ChevronRight, ArrowRight, Lock,
  Sparkles, FileText, Activity, X, MessageSquare, Phone,
  Globe, LayoutDashboard, ChevronDown
} from 'lucide-react';

type ModuleTabId = 'kesantrian' | 'akademik' | 'keuangan' | 'disiplin' | 'kesehatan' | 'rfid';

interface PublicContactData {
  companyName: string;
  companyEmail: string | null;
  companyPhone: string | null;
  companyWhatsApp: string | null;
  companyWebsite: string | null;
}

export function SaasLandingPage() {
  const [activeTab, setActiveTab] = useState<ModuleTabId>('kesantrian');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [platformContact, setPlatformContact] = useState<PublicContactData | null>(null);

  useEffect(() => {
    fetch('/api/saas/company-contact')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setPlatformContact(res.data);
        }
      })
      .catch((err) => console.error('Failed to fetch platform contact settings:', err));
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsContactModalOpen(true);
  };

  const formattedWhatsAppUrl = platformContact?.companyWhatsApp
    ? platformContact.companyWhatsApp.startsWith('http://') || platformContact.companyWhatsApp.startsWith('https://')
      ? platformContact.companyWhatsApp
      : `https://wa.me/${platformContact.companyWhatsApp.replace(/[^0-9]/g, '')}`
    : null;

  return (
    <div className="min-h-screen bg-stone-950 font-sans text-stone-100 antialiased selection:bg-emerald-500 selection:text-white">
      {/* ── Contact Modal ─────────────────────────────────────────── */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg p-6 bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl space-y-6">
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-full bg-stone-800/50 hover:bg-stone-800 transition"
              aria-label="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Konsultasi & Layanan Informasi</span>
              </div>
              <h3 className="text-xl font-bold text-white">Hubungi Tim {SAAS_PRODUCT_CONFIG.name}</h3>
              <p className="text-stone-400 text-xs leading-relaxed">
                Tim spesialis {COMPANY_CONFIG.name} siap membantu perencanaan digitalisasi pesantren dan demonstrasi platform secara langsung.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {/* WhatsApp CTA (Rendered ONLY if WhatsApp is configured) */}
              {formattedWhatsAppUrl ? (
                <a
                  href={formattedWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-semibold text-sm transition group"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-emerald-400" />
                    <span>Chat WhatsApp Tim Sales & Support</span>
                  </div>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </a>
              ) : null}

              {/* Email CTA */}
              {platformContact?.companyEmail ? (
                <a
                  href={`mailto:${platformContact.companyEmail}`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 font-semibold text-sm transition group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-stone-400" />
                    <span>Email: {platformContact.companyEmail}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </a>
              ) : (
                <div className="p-4 rounded-2xl bg-stone-800/60 border border-stone-800 text-stone-400 text-xs flex items-center gap-3">
                  <FileText className="w-4 h-4 text-stone-500" />
                  <span>Email belum dikonfigurasi</span>
                </div>
              )}

              {/* Phone CTA */}
              {platformContact?.companyPhone ? (
                <a
                  href={`tel:${platformContact.companyPhone}`}
                  className="flex items-center justify-between p-4 rounded-2xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 font-semibold text-sm transition group"
                >
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-stone-400" />
                    <span>Telepon: {platformContact.companyPhone}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </a>
              ) : (
                <div className="p-4 rounded-2xl bg-stone-800/60 border border-stone-800 text-stone-400 text-xs flex items-center gap-3">
                  <Phone className="w-4 h-4 text-stone-500" />
                  <span>Nomor telepon belum dikonfigurasi</span>
                </div>
              )}

              {/* Website CTA */}
              {platformContact?.companyWebsite ? (
                <a
                  href={platformContact.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 font-semibold text-sm transition group"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-purple-400" />
                    <span>Website: {platformContact.companyWebsite}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </a>
              ) : null}
            </div>

            <div className="pt-2 border-t border-stone-800 text-center">
              <span className="text-[11px] text-stone-500">{COMPANY_CONFIG.attribution}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation Bar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b border-stone-800/80 bg-stone-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/30 border border-emerald-400/20">
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
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-stone-300">
            <a href="#fitur" className="hover:text-emerald-400 transition">Fitur Platform</a>
            <a href="#modul" className="hover:text-emerald-400 transition">Modul Operasional</a>
            <a href="#keunggulan" className="hover:text-emerald-400 transition">Keunggulan</a>
            <a href="#alur" className="hover:text-emerald-400 transition">Cara Kerja</a>
            <a href="#faq" className="hover:text-emerald-400 transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/register"
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-900/20 transition whitespace-nowrap"
            >
              Daftar Instansi
            </Link>
            <Link
              href="/login"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-200 hover:text-white bg-stone-900 hover:bg-stone-800 border border-stone-700/80 transition whitespace-nowrap"
            >
              Masuk Portal
            </Link>
            <button
              onClick={handleContactClick}
              className="hidden lg:inline-flex px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-300 hover:text-white bg-stone-900/60 hover:bg-stone-800/80 border border-stone-800 transition whitespace-nowrap"
            >
              Konsultasi Demo
            </button>
          </div>
        </div>
      </header>

      {/* ── SECTION 1: HERO ────────────────────────────────────────── */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden border-b border-stone-800/50">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{SAAS_PRODUCT_CONFIG.tagline}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Satu Platform Cloud untuk Seluruh Tata Kelola <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">Pesantren Modern</span>
          </h1>

          <p className="text-stone-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            {SAAS_PRODUCT_CONFIG.description}
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-extrabold text-sm shadow-xl shadow-emerald-900/30 flex items-center justify-center gap-2 transition group"
              >
                <span>Daftar Instansi Sekarang</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </Link>

              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-200 font-semibold text-sm flex items-center justify-center gap-2 transition"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                <span>Masuk Portal Pesantren</span>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-stone-400 pt-1">
              <span>Kelola pesantren Anda dalam satu platform terpadu.</span>
              <button
                onClick={handleContactClick}
                className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-4 transition inline-flex items-center gap-1"
              >
                <span>Konsultasikan Kebutuhan Pesantren</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Platform Representation Card */}
          <div className="pt-10 max-w-5xl mx-auto">
            <div className="p-3 md:p-4 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-2xl shadow-black/80 space-y-3">
              <div className="flex items-center justify-between px-3 py-2 border-b border-stone-800 text-xs text-stone-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-mono text-[11px] text-stone-400">mahadmanager.cloud / dashboard</span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Multi-Tenant RLS Active
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-2 text-left">
                <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span>Manajemen Kesantrian</span>
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-bold text-white">Terpusat & Realtime</div>
                  <p className="text-[11px] text-stone-400">Status santri, wali, kamar asrama, & perizinan keluar.</p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span>Pembayaran SPP Otomatis</span>
                    <CreditCard className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="text-xl font-bold text-white">Flip for Business</div>
                  <p className="text-[11px] text-stone-400">Integrasi webhook callback saldo & invois SPP otomatis.</p>
                </div>

                <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span>Website Publik Lembaga</span>
                    <Globe className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-bold text-white">Branding Mandiri</div>
                  <p className="text-[11px] text-stone-400">Website publik pesantren otomatis dengan domain sendiri.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: PROBLEM & SOLUTION ──────────────────────────── */}
      <section className="py-20 border-b border-stone-800/50 bg-stone-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Tantangan Operasional Pesantren Tradisional
            </h2>
            <p className="text-stone-400 text-xs md:text-sm">
              Banyak lembaga pesantren menghadapi kerumitan karena mengoperasikan sistem internal secara terpisah-pisah.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-stone-900/60 border border-stone-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Data Santri Tersebar</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Catatan manual di spreadsheet terpisah antara bagian pengasuhan, pengajar akademik, dan bendahara.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-stone-900/60 border border-stone-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Rekapitulasi SPP Manual</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Konfirmasi bukti transfer manual via pesan instan memicu risiko ketidakcocokan saldo dan piutang.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-stone-900/60 border border-stone-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Kedisiplinan Tidak Terrekam</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Poin pelanggaran dan surat izin keluar santri sulit dipantau secara objektif oleh pimpinan.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-stone-900/60 border border-stone-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Website Publik Terpisah</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Website profil lembaga tidak terhubung dengan portal pendaftaran dan informasi sistem internal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: CORE CAPABILITIES (VERIFIED ONLY) ───────────── */}
      <section id="modul" className="py-20 border-b border-stone-800/50 bg-stone-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>Modul Operasional Terverifikasi</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Modul Terintegrasi yang Siap Digunakan
            </h2>
            <p className="text-stone-400 text-xs md:text-sm">
              Seluruh modul dibangun di atas arsitektur database terpusat yang saling terhubung secara konsisten.
            </p>
          </div>

          {/* Interactive Module Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'kesantrian', label: 'Kesantrian & Asrama', icon: Users },
              { id: 'akademik', label: 'Akademik & E-Rapor', icon: Layers },
              { id: 'keuangan', label: 'Keuangan & Auto SPP', icon: CreditCard },
              { id: 'disiplin', label: 'E-Tatib & Disiplin', icon: ShieldCheck },
              { id: 'kesehatan', label: 'Kesehatan & UKS', icon: Stethoscope },
              { id: 'rfid', label: 'Presensi RFID & POS', icon: Smartphone },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ModuleTabId)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-emerald-500 text-stone-950 shadow-md shadow-emerald-900/30'
                      : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Module Tab Details */}
          <div className="p-8 rounded-3xl bg-stone-900 border border-stone-800 max-w-4xl mx-auto shadow-xl">
            {activeTab === 'kesantrian' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Modul Kesantrian & Manajemen Asrama</h3>
                    <p className="text-xs text-stone-400">Pengelolaan master data santri, wali santri, dan pemetaan kamar asrama.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-stone-300">
                  <div className="flex items-center gap-2">✓ Lifecycle status santri (Aktif, Cuti, Skors, Lulus, Keluar)</div>
                  <div className="flex items-center gap-2">✓ Manajemen gedung asrama & pemetaan kapasitas kamar</div>
                  <div className="flex items-center gap-2">✓ Alur alumni otomatis dengan riwayat historis</div>
                  <div className="flex items-center gap-2">✓ Data kontak & domisili wali santri terintegrasi</div>
                </div>
              </div>
            )}

            {activeTab === 'akademik' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Modul Akademik & E-Rapor Santri</h3>
                    <p className="text-xs text-stone-400">Manajemen struktur kurikulum formal & diniyah beserta e-rapor.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-stone-300">
                  <div className="flex items-center gap-2">✓ Pengaturan Master Jenjang, Tingkat, & Kelas</div>
                  <div className="flex items-center gap-2">✓ Alokasi penugasan pengajar & mata pelajaran</div>
                  <div className="flex items-center gap-2">✓ Penginputan nilai penilaian & penimbangan bobot</div>
                  <div className="flex items-center gap-2">✓ Cetak E-Rapor cetakan otomatis per-semester</div>
                </div>
              </div>
            )}

            {activeTab === 'keuangan' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Modul Keuangan & Payment Gateway SPP</h3>
                    <p className="text-xs text-stone-400">Otomatisasi tagihan bulanan SPP terintegrasi Flip for Business.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-stone-300">
                  <div className="flex items-center gap-2">✓ Webhook callback verifikasi pembayaran realtime</div>
                  <div className="flex items-center gap-2">✓ Notifikasi tagihan SPP & konfirmasi transaksi lunas</div>
                  <div className="flex items-center gap-2">✓ Pencatatan ledger tagihan per-wali santri</div>
                  <div className="flex items-center gap-2">✓ Rekapitulasi pembayaran bulanan & tunggakan</div>
                </div>
              </div>
            )}

            {activeTab === 'disiplin' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Modul E-Tatib & Point Pelanggaran</h3>
                    <p className="text-xs text-stone-400">Pencatatan pelanggaran disiplin & ambang batas toleransi poin.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-stone-300">
                  <div className="flex items-center gap-2">✓ Kategori pelanggaran (Ringan, Sedang, Berat, Sangat Berat)</div>
                  <div className="flex items-center gap-2">✓ Konfigurasi Tolerance Policy per-jenjang</div>
                  <div className="flex items-center gap-2">✓ Tracking Governance Case & penetapan hukuman</div>
                  <div className="flex items-center gap-2">✓ Audit log pencatatan hukuman & pemulihan poin</div>
                </div>
              </div>
            )}

            {activeTab === 'kesehatan' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Modul Kesehatan (UKS) & Rekam Medis</h3>
                    <p className="text-xs text-stone-400">Pencatatan kunjungan UKS santri & surat izin berobat luar.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-stone-300">
                  <div className="flex items-center gap-2">✓ Pencatatan Health Visits & keluhan santri di UKS</div>
                  <div className="flex items-center gap-2">✓ Alur pengajuan Health Permission (Izin Berobat)</div>
                  <div className="flex items-center gap-2">✓ Verifikasi rujukan medis & santri pendamping</div>
                  <div className="flex items-center gap-2">✓ Rekam historis medis santri selama di pesantren</div>
                </div>
              </div>
            )}

            {activeTab === 'rfid' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Presensi RFID & POS Kantin Cashless</h3>
                    <p className="text-xs text-stone-400">Integrasi kartu KTA RFID untuk gate checkpoint & kantin.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-stone-300">
                  <div className="flex items-center gap-2">✓ Tap presensi RFID gerbang (/api/gate/scan-in)</div>
                  <div className="flex items-center gap-2">✓ Transaksi kasir kantin cashless (/api/canteen/pay)</div>
                  <div className="flex items-center gap-2">✓ Pembatasan limit saldo harian belanja santri</div>
                  <div className="flex items-center gap-2">✓ Cetak & manajemen KTA RFID fisik santri</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: ADVANTAGES & SECURITY (FACTUAL CLAIMS) ──────── */}
      <section id="keunggulan" className="py-20 border-b border-stone-800/50 bg-stone-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Arsitektur & Keamanan Platform</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Keunggulan Arsitektur Multi-Tenant Hardened
            </h2>
            <p className="text-stone-400 text-xs md:text-sm">
              Dirancang khusus untuk mendukung pertumbuhan pesantren dengan perlindungan isolasi data antar-lembaga.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Isolasi Tenant Berlapis</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Setiap pesantren memiliki isolasi data ketat berbasis skema Supabase Row-Level Security (RLS) dan verifikasi konteks transaksi di sisi server.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Dual Digital Presence</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Pesantren secara otomatis memperoleh Dashboard Manajemen Internal sekaligus Website Publik Resmi dengan logo, warna, & domain sendiri.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Audit Trail Permanen</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Setiap tindakan pembuatan, pengubahan, penolakan, dan persetujuan data dicatat secara permanen untuk transparansi tata kelola.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: HOW IT WORKS ─────────────────────────────────── */}
      <section id="alur" className="py-20 border-b border-stone-800/50 bg-stone-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              5 Langkah Mudah Mulai Berlangganan
            </h2>
            <p className="text-stone-400 text-xs md:text-sm">
              Proses onboarding terstruktur untuk memastikan kesiapan sistem di lembaga Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-center">
            {[
              { step: '01', title: 'Konsultasi', desc: 'Diskusikan skala santri & modul kebutuhan pesantren.' },
              { step: '02', title: 'Provisi Tenant', desc: 'Lingkungan tenant & website publik disiapkan.' },
              { step: '03', title: 'Konfigurasi', desc: 'Atur jenjang, tingkat, kelas, & penugasan guru.' },
              { step: '04', title: 'Impor Data', desc: 'Masukkan data santri & wali secara kolektif.' },
              { step: '05', title: 'Go Live', desc: 'Sistem internal & portal publik resmi beroperasi.' },
            ].map((s, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-2 relative">
                <div className="text-2xl font-black text-emerald-400">{s.step}</div>
                <h3 className="text-sm font-bold text-white">{s.title}</h3>
                <p className="text-[11px] text-stone-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: STRUCTURAL TIERS (NO SPECIFIC PRICES RULE) ─── */}
      <section className="py-20 border-b border-stone-800/50 bg-stone-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Pilihan Skala Layanan Pesantren
            </h2>
            <p className="text-stone-400 text-xs md:text-sm">
              Fleksibilitas kapasitas modul disesuaikan dengan perkembangan jumlah santri lembaga Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-stone-800 text-stone-300 uppercase tracking-wider">
                  Starter Tier
                </span>
                <h3 className="text-xl font-bold text-white">Pesantren Perintis</h3>
                <p className="text-xs text-stone-400">Dirancang untuk pesantren berkembang dengan skala santri terbatas.</p>
                <div className="pt-3 border-t border-stone-800 space-y-2 text-xs text-stone-300">
                  <div className="flex items-center gap-2">✓ Modul Kesantrian & Asrama</div>
                  <div className="flex items-center gap-2">✓ Modul Akademik & E-Rapor</div>
                  <div className="flex items-center gap-2">✓ Website Publik Pesantren</div>
                </div>
              </div>
              <button
                onClick={handleContactClick}
                className="w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-750 text-white font-semibold text-xs transition"
              >
                Konsultasikan Kebutuhan
              </button>
            </div>

            {/* Pro */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-stone-900 via-emerald-950/40 to-stone-900 border border-emerald-500/40 space-y-4 flex flex-col justify-between relative shadow-xl shadow-emerald-950/50">
              <div className="absolute top-3 right-3 text-[9px] font-black bg-emerald-500 text-stone-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                POPULER
              </div>
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 uppercase tracking-wider">
                  Pro Tier
                </span>
                <h3 className="text-xl font-bold text-white">Pesantren Menengah</h3>
                <p className="text-xs text-emerald-100/80">Solusi lengkap otomatisasi keuangan & perizinan santri.</p>
                <div className="pt-3 border-t border-emerald-500/20 space-y-2 text-xs text-emerald-100">
                  <div className="flex items-center gap-2">✓ Semua Kemampuan Starter</div>
                  <div className="flex items-center gap-2">✓ Payment Gateway Auto SPP (Flip)</div>
                  <div className="flex items-center gap-2">✓ Modul E-Tatib & Tolerance Policy</div>
                  <div className="flex items-center gap-2">✓ Modul Kesehatan UKS</div>
                </div>
              </div>
              <button
                onClick={handleContactClick}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow-md shadow-emerald-900/30 transition"
              >
                Konsultasikan Kebutuhan
              </button>
            </div>

            {/* Enterprise */}
            <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 uppercase tracking-wider">
                  Enterprise Tier
                </span>
                <h3 className="text-xl font-bold text-white">Pesantren Kompleks</h3>
                <p className="text-xs text-stone-400">Kapasitas penuh dengan integrasi hardware RFID & Kantin POS.</p>
                <div className="pt-3 border-t border-stone-800 space-y-2 text-xs text-stone-300">
                  <div className="flex items-center gap-2">✓ Semua Kemampuan Pro Tier</div>
                  <div className="flex items-center gap-2">✓ Presensi KTA RFID & Gate Checkpoint</div>
                  <div className="flex items-center gap-2">✓ POS Kantin Digital Cashless</div>
                  <div className="flex items-center gap-2">✓ Dukungan Khusus & Pendampingan</div>
                </div>
              </div>
              <button
                onClick={handleContactClick}
                className="w-full py-3 rounded-xl bg-stone-800 hover:bg-stone-750 text-white font-semibold text-xs transition"
              >
                Konsultasikan Kebutuhan
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: FAQ ─────────────────────────────────────────── */}
      <section id="faq" className="py-20 border-b border-stone-800/50 bg-stone-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-stone-400 text-xs md:text-sm">
              Informasi lengkap seputar arsitektur platform dan alur penggunaan.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: `Apa itu ${SAAS_PRODUCT_CONFIG.name}?`,
                a: `${SAAS_PRODUCT_CONFIG.name} adalah platform SaaS manajemen pesantren terpadu yang mengintegrasikan tata kelola kesantrian, akademik, keuangan SPP otomatis, hingga website publik lembaga.`
              },
              {
                q: "Apakah data pesantren kami aman & terpisah dari pesantren lain?",
                a: "Ya. Platform dibangun dengan arsitektur multi-tenant hardened menggunakan Supabase Row-Level Security (RLS) dan verifikasi konteks transaksi di sisi server untuk menjamin isolasi data mutlak."
              },
              {
                q: "Apakah pesantren mendapatkan website publik tersendiri?",
                a: "Ya. Setiap pesantren secara otomatis memperoleh website publik resmi dengan logo, warna utama, profil, berita, dan domain lembaga sendiri."
              },
              {
                q: "Bagaimana alur pembayaran SPP santri secara otomatis?",
                a: "Sistem terhubung langsung dengan Payment Gateway (Flip for Business) yang memproses verifikasi webhook transaksi secara realtime tanpa rekapitulasi manual."
              },
              {
                q: "Bagaimana cara mulai mengadopsi platform ini?",
                a: "Klik tombol 'Konsultasikan Kebutuhan' untuk menghubungi tim kami. Kami akan mendampingi proses konfigurasi jenjang, penyiapan domain, dan impor data santri."
              }
            ].map((faq, idx) => (
              <div key={idx} className="rounded-2xl bg-stone-900 border border-stone-800 overflow-hidden">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between font-semibold text-sm text-white hover:text-emerald-400 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${openFaq === idx ? 'rotate-180 text-emerald-400' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-stone-400 leading-relaxed border-t border-stone-800/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 8: FINAL CTA BANNER ────────────────────────────── */}
      <section className="py-20 bg-gradient-to-r from-stone-950 via-emerald-950 to-stone-950 border-b border-stone-800/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Siap Bertransformasi Menuju Manajemen Pesantren Modern?
          </h2>
          <p className="text-stone-300 text-xs md:text-sm max-w-2xl mx-auto leading-relaxed">
            Bergabunglah dengan ekosistem digital {SAAS_PRODUCT_CONFIG.name} untuk mewujudkan tata kelola pesantren yang transparan, teratur, dan profesional.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-extrabold text-sm shadow-xl shadow-emerald-900/40 inline-flex items-center justify-center gap-2 transition group"
            >
              <span>Daftar Instansi Sekarang</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </Link>
            <button
              onClick={handleContactClick}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-200 font-semibold text-sm inline-flex items-center justify-center gap-2 transition"
            >
              <span>Konsultasi & Demo Platform</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER & COMPANY ATTRIBUTION ───────────────────────────── */}
      <footer className="py-12 bg-stone-950 border-t border-stone-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-stone-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="text-base font-bold text-white">{SAAS_PRODUCT_CONFIG.name}</span>
            </div>

            <div className="flex items-center gap-6 text-xs text-stone-400">
              <Link href="/register" className="hover:text-emerald-400 transition font-medium text-stone-300">Daftar Instansi</Link>
              <Link href="/login" className="hover:text-white transition">Login Portal</Link>
              <a href="#fitur" className="hover:text-white transition">Fitur</a>
              <a href="#modul" className="hover:text-white transition">Modul</a>
              <a href="#faq" className="hover:text-white transition">FAQ</a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
            <div>
              © 2026 {SAAS_PRODUCT_CONFIG.name}. All rights reserved.
            </div>

            {/* COMPANY BRAND ATTRIBUTION (LOCKED: SERZEN DEV) */}
            <div className="flex items-center gap-2 font-mono text-[11px] text-stone-400">
              <span>{COMPANY_CONFIG.attribution}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
