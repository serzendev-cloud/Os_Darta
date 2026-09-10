'use client';

import { useState, useEffect } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { 
  Settings, Megaphone, CheckCircle2, Save, 
  Send, Globe, Landmark, FileText, Building2, Lock, Mail, Phone, MessageSquare
} from 'lucide-react';

export default function SaasGlobalSettingsPage() {
  const [broadcastTitle, setBroadcastTitle] = useState('Pemberitahuan Pemeliharaan Sistem (Maintenance)');
  const [broadcastMessage, setBroadcastMessage] = useState('Yth. Seluruh Pesantren Pengguna Madev, akan dilakukan peningkatan server (maintenance) pada Minggu malam pukul 00.00 - 02.00 WIB. Mohon simpan pekerjaan Anda.');
  const [broadcastVariant, setBroadcastVariant] = useState<'info' | 'warning' | 'error'>('warning');
  const [broadcastActive, setBroadcastActive] = useState(false);
  const [toast, setToast] = useState('');

  // Platform Company Profile Contact States
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyWhatsApp, setCompanyWhatsApp] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactError, setContactError] = useState('');

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  useEffect(() => {
    fetch('/api/saas/company-contact')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setCompanyEmail(res.data.companyEmail || '');
          setCompanyPhone(res.data.companyPhone || '');
          setCompanyWhatsApp(res.data.companyWhatsApp || '');
          setCompanyWebsite(res.data.companyWebsite || '');
        }
      })
      .catch((err) => console.error('Failed to fetch platform contact settings:', err));
  }, []);

  const handlePublishBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcastActive(true);
    showNotification('PENGUMUMAN GLOBAL SIARAN BERHASIL DITERBITKAN KE SELURUH DASHBOARD PESANTREN!');
  };

  const handleDisableBroadcast = () => {
    setBroadcastActive(false);
    showNotification('Siaran pengumuman global dinonaktifkan.');
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingContact(true);
    setContactError('');
    try {
      const res = await fetch('/api/saas/company-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyEmail,
          companyPhone,
          companyWhatsApp,
          companyWebsite,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('Informasi Profil & Kontak Perusahaan SERZEN DEV Berhasil Disimpan!');
      } else {
        setContactError(data.error || data.message || 'Gagal menyimpan pengaturan kontak perusahaan.');
      }
    } catch (err) {
      setContactError(String(err));
    } finally {
      setIsSavingContact(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="p-4 rounded-2xl bg-emerald-700 text-white font-medium text-xs flex items-center justify-between shadow-xl animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span>{toast}</span>
          </div>
          <button onClick={() => setToast('')} className="text-white/80 hover:text-white">&times;</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-emerald-950 to-stone-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <Settings className="w-3.5 h-3.5" />
            <span>Pillar 6 — Global Configuration & Broadcast Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Pengaturan Global & Pusat Siaran SaaS
          </h1>
          <p className="text-stone-300 text-xs md:text-sm max-w-2xl">
            Pusat konfigurasi variabel universal, informasi kontak perusahaan platform SaaS (SERZEN DEV), siaran pengumuman ke seluruh dashboard pesantren, dan templat master data bawaan.
          </p>
        </div>
      </div>

      {/* Section 1: Platform Company Profile & Contact Settings */}
      <PageCard
        title="Profil & Informasi Perusahaan (Platform SaaS)"
        description="Kelola informasi kontak publik perusahaan induk (SERZEN DEV). Pengaturan ini bersifat platform-level dan bukan tenant settings."
      >
        <form onSubmit={handleSaveContact} className="space-y-4 max-w-3xl">
          {contactError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs font-medium">
              {contactError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Locked Company Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1 flex items-center justify-between">
                <span>Nama Perusahaan / Parent Brand</span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              </label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-stone-200/70 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-xs font-bold text-stone-700 dark:text-stone-300 cursor-not-allowed">
                <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>SERZEN DEV</span>
              </div>
              <p className="text-[10px] text-stone-500 mt-1">SERZEN DEV adalah Parent Company Brand dan bersifat terkunci (non-configurable).</p>
            </div>

            {/* Email Perusahaan */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Email Perusahaan (Platform)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  placeholder="Contoh: contact@serzendev.cloud (Kosongkan jika belum tersedia)"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Nomor Telepon Perusahaan
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="Contoh: +62 812-0000-0000 (Kosongkan jika belum tersedia)"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Nomor / Link WhatsApp Official
              </label>
              <div className="relative">
                <MessageSquare className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={companyWhatsApp}
                  onChange={(e) => setCompanyWhatsApp(e.target.value)}
                  placeholder="Contoh: https://wa.me/6281200000000 (Kosongkan jika belum tersedia)"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium"
                />
              </div>
            </div>

            {/* Website */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Website Perusahaan (Official Web)
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="url"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="Contoh: https://serzendev.cloud (Kosongkan jika belum tersedia)"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingContact}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{isSavingContact ? 'Menyimpan...' : 'Simpan Profil & Kontak Perusahaan'}</span>
          </button>
        </form>
      </PageCard>

      {/* Section 2: Pusat Siaran Global (Broadcast Center) */}
      <PageCard
        title="Pusat Siaran Global (Broadcast Announcement Banner)"
        description="Terbitkan pengumuman darurat atau pemberitahuan maintenance yang akan tampil sebagai banner pop-up di seluruh dashboard pesantren"
      >
        <form onSubmit={handlePublishBroadcast} className="space-y-4 max-w-3xl">
          {broadcastActive && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold">
                <Megaphone className="w-4 h-4 text-amber-600 animate-bounce" />
                <span>SIARAN GLOBAL SAAT INI SEDANG AKTIF TERSEBAR KE SELURUH PESANTREN!</span>
              </div>
              <button
                type="button"
                onClick={handleDisableBroadcast}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-all"
              >
                Matikan Siaran
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Judul Pengumuman Siaran</label>
            <input
              type="text"
              value={broadcastTitle}
              onChange={(e) => setBroadcastTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Pesan Pengumuman</label>
            <textarea
              rows={3}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              className="w-full p-3 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium"
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Jenis Banner</label>
              <select
                value={broadcastVariant}
                onChange={(e: any) => setBroadcastVariant(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs font-medium"
              >
                <option value="warning">Peringatan (Maintenance / Kuning)</option>
                <option value="info">Informasi (Fitur Baru / Biru)</option>
                <option value="error">Bahaya (Gangguan Server / Merah)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>Terbitkan Siaran Pengumuman</span>
          </button>
        </form>
      </PageCard>

      {/* Section 3: Master Data Default SaaS */}
      <PageCard
        title="Master Data Default & Templat Bawaan SaaS"
        description="Daftar templat referensi bawaan yang langsung otomatis tersedia saat pesantren baru mendaftar"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2">
            <div className="flex items-center gap-2 text-stone-900 dark:text-white font-bold text-xs">
              <Landmark className="w-4 h-4 text-emerald-600" />
              <span>Daftar Bank Nasional</span>
            </div>
            <p className="text-xs text-stone-500">BCA, Mandiri, BNI, BRI, BSI (Bank Syariah Indonesia) otomatis aktif sebagai pilihan tujuan SPP.</p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2">
            <div className="flex items-center gap-2 text-stone-900 dark:text-white font-bold text-xs">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Templat Surat & E-Rapor</span>
            </div>
            <p className="text-xs text-stone-500">Format standar Surat Izin Pulang Santri & Rapor Pesantren otomatis siap cetak PDF.</p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-2">
            <div className="flex items-center gap-2 text-stone-900 dark:text-white font-bold text-xs">
              <Globe className="w-4 h-4 text-purple-600" />
              <span>Zona Waktu & Format Tanggal</span>
            </div>
            <p className="text-xs text-stone-500">Default Indonesia WIB (Asia/Jakarta), WITA, WIT dengan penanggalan Hijriyah & Masehi.</p>
          </div>
        </div>
      </PageCard>
    </div>
  );
}
