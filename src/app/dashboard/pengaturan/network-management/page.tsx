'use client';

import Link from 'next/link';
import { PageCard } from '@/components/shared/page-header';
import { 
  Wifi, Router, ShieldAlert, Cpu, Activity, ArrowLeft, Clock, 
  Sparkles, Sliders, Lock, Gauge, Network, Radio
} from 'lucide-react';

const futureFeatures = [
  { title: 'Router Management', desc: 'Sentralisasi kontrol & status konektivitas router pesantren', icon: Router },
  { title: 'Connected Devices', desc: 'Monitoring perangkat santri, ustadz, dan staf yang terhubung', icon: Cpu },
  { title: 'WiFi Access Control', desc: 'Pengaturan SSIDs, otentikasi voucher, dan pembatasan akses WiFi', icon: Wifi },
  { title: 'Bandwidth Management', desc: 'Alokasi bandwidth & prioritas trafik internet per gedung/asrama', icon: Gauge },
  { title: 'Internet Schedule', desc: 'Jadwal otomatis pemadaman/pembatasan internet saat jam ibadah & belajar', icon: Clock },
  { title: 'Network Access Policy', desc: 'Kebijakan pemblokiran situs, domain, dan aturan keamanan jaringan', icon: ShieldAlert },
  { title: 'Device Access Control', desc: 'Whitelist & blacklist perangkat berdasarkan MAC address', icon: Lock },
  { title: 'Network Monitoring', desc: 'Grafik real-time penggunaan trafik & latensi jaringan', icon: Activity },
  { title: 'Network Audit Log', desc: 'Catatan audit riwayat aktivitas & perubahan kebijakan jaringan', icon: Radio },
];

export default function NetworkManagementPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-10">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/pengaturan"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-all min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600" />
          <span>KEMBALI KE PENGATURAN</span>
        </Link>

        <span className="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 min-h-[36px]">
          <Sparkles className="w-3.5 h-3.5" /> COMING SOON
        </span>
      </div>

      <PageCard
        title="Network Management — Pengelolaan Jaringan Pesantren"
        description="Pusat Kontrol Terpadu Router, Perangkat, WiFi, Bandwidth, & Kebijakan Akses Jaringan Pesantren"
      >
        <div className="space-y-6">
          {/* Main Coming Soon Banner */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-stone-900 via-emerald-950 to-stone-900 text-white space-y-4 border border-emerald-500/20 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                <Network className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                  Modul Masa Depan Ma'had Manager
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  Network Management (Dalam Pengembangan)
                </h2>
              </div>
            </div>

            <p className="text-sm text-stone-300 max-w-3xl leading-relaxed">
              Pengelolaan jaringan pesantren akan memungkinkan administrator mengatur router, perangkat yang terhubung, 
              akses WiFi, alokasi bandwidth, dan kebijakan internet dari satu antarmuka terintegrasi di Ma'had Manager.
            </p>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Status Fitur: <strong>COMING SOON</strong>. Belum ada kontrol router nyata atau integrasi perangkat keras yang aktif pada versi ini.
              </span>
            </div>
          </div>

          {/* Future Scope Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              Cakupan Fitur Masa Depan (Future Scope):
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {futureFeatures.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="p-4 rounded-2xl bg-background border border-border space-y-2 hover:border-emerald-500/40 transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        PLANNED
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-foreground mt-1">{item.title}</h4>
                    <p className="text-[11px] text-muted-foreground leading-snug">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-border flex items-center justify-between flex-wrap gap-4">
            <span className="text-xs text-muted-foreground">
              Membutuhkan informasi lebih lanjut mengenai roadmap arsitektur jaringan? Hubungi tim pengembang.
            </span>

            <Link
              href="/dashboard/pengaturan"
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md transition-all active:scale-95 min-h-[44px] flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>KEMBALI KE PENGATURAN</span>
            </Link>
          </div>
        </div>
      </PageCard>
    </div>
  );
}
