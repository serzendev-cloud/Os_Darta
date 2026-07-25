'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { 
  Settings, Megaphone, Database, CheckCircle2, Save, 
  AlertCircle, Sparkles, Send, Globe, Shield, Landmark, FileText
} from 'lucide-react';

export default function SaasGlobalSettingsPage() {
  const [broadcastTitle, setBroadcastTitle] = useState('Pemberitahuan Pemeliharaan Sistem (Maintenance)');
  const [broadcastMessage, setBroadcastMessage] = useState('Yth. Seluruh Pesantren Pengguna Madev, akan dilakukan peningkatan server (maintenance) pada Minggu malam pukul 00.00 - 02.00 WIB. Mohon simpan pekerjaan Anda.');
  const [broadcastVariant, setBroadcastVariant] = useState<'info' | 'warning' | 'error'>('warning');
  const [broadcastActive, setBroadcastActive] = useState(false);
  const [toast, setToast] = useState('');

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handlePublishBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcastActive(true);
    showNotification('PENGUMUMAN GLOBAL SIARAN BERHASIL DITERBITKAN KE SELURUH DASHBOARD PESANTREN!');
  };

  const handleDisableBroadcast = () => {
    setBroadcastActive(false);
    showNotification('Siaran pengumuman global dinonaktifkan.');
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
            Pusat konfigurasi variabel universal, siaran pengumuman ke seluruh dashboard pesantren, dan templat master data bawaan.
          </p>
        </div>
      </div>

      {/* Section 1: Pusat Siaran Global (Broadcast Center) */}
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

      {/* Section 2: Master Data Default SaaS */}
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
