'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { useAuth } from '@/hooks';
import {
  User, Bell, Palette, LogOut,
  Save, RotateCcw, Mail, Smartphone, Globe,
  Shield, Key, Laptop, Smartphone as PhoneIcon,
  PieChart, Activity,
} from 'lucide-react';

interface NotifSettings { email: boolean; whatsapp: boolean; push: boolean; }
interface AppSettings { darkMode: boolean; compactMode: boolean; language: string; }
interface ChartSettings { theme: string; animation: boolean; gradient: boolean; smoothLines: boolean; }

interface Props {
  notifSettings: NotifSettings;
  setNotifSettings: (s: NotifSettings) => void;
  appSettings: AppSettings;
  setAppSettings: (s: AppSettings) => void;
  chartSettings: ChartSettings;
  setChartSettings: (s: ChartSettings) => void;
  handleSave: () => void;
  handleReset: () => void;
  isSaving: boolean;
}

export function AccountTab({
  notifSettings, setNotifSettings,
  appSettings, setAppSettings,
  chartSettings, setChartSettings,
  handleSave, handleReset, isSaving,
}: Props) {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-background border border-border rounded-lg transition-all active:scale-95 shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Reset</span>
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary-foreground bg-primary rounded-lg transition-all hover:bg-primary/90 active:scale-95 shadow-sm disabled:opacity-70"
        >
          {isSaving ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile */}
        <PageCard title="Profil Pengguna" description="Informasi dasar akun Anda">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-background shadow-md flex items-center justify-center text-3xl font-bold text-primary">
                {user?.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') || '-'}
              </div>
              <button className="text-xs font-semibold text-primary hover:underline">Ubah Foto</button>
            </div>
            <div className="flex-1 space-y-4 w-full">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama Lengkap</label>
                <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 rounded-lg border border-border/50">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{user?.name || '-'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</label>
                <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 rounded-lg border border-border/50">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{user?.email || '-'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role / Hak Akses</label>
                <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 rounded-lg border border-border/50">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-primary capitalize">{user?.role || ''}</span>
                </div>
              </div>
              <button className="w-full py-2.5 mt-2 bg-background border border-border rounded-lg text-sm font-semibold hover:bg-muted transition-colors shadow-sm">
                Edit Data Profil
              </button>
            </div>
          </div>
        </PageCard>

        {/* Security */}
        <PageCard title="Keamanan & Akses" description="Kelola kata sandi dan sesi login Anda">
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Key className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Ubah Password</h4>
                  <p className="text-xs text-muted-foreground">Terakhir diubah 3 bulan lalu</p>
                </div>
              </div>
              <button className="px-3 py-1.5 text-xs font-semibold border border-border rounded-md hover:bg-muted transition-colors">
                Update
              </button>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sesi Aktif Saat Ini</h4>
              <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-3">
                  <Laptop className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Windows 11 · Chrome</p>
                    <p className="text-[10px] text-muted-foreground">IP: 192.168.1.10 · Saat ini aktif</p>
                  </div>
                </div>
                <StatusBadge status="aktif" variant="success" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">iPhone 13 Pro · Safari</p>
                    <p className="text-[10px] text-muted-foreground">Login terakhir: Kemarin, 14:30 WIB</p>
                  </div>
                </div>
              </div>
            </div>
            <button className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              Logout dari Semua Perangkat
            </button>
          </div>
        </PageCard>

        {/* Notifications */}
        <PageCard title="Notifikasi" description="Atur bagaimana Anda menerima pemberitahuan">
          <div className="space-y-2">
            {[
              { key: 'email', icon: Mail, color: 'blue', title: 'Email Notifications', desc: 'Laporan mingguan & alert penting' },
              { key: 'whatsapp', icon: Smartphone, color: 'emerald', title: 'WhatsApp Bot', desc: 'Notifikasi instan via WhatsApp' },
              { key: 'push', icon: Bell, color: 'purple', title: 'Push Notifications', desc: 'Notifikasi langsung di browser' },
            ].map((item) => {
              const Icon = item.icon;
              const enabled = notifSettings[item.key as keyof NotifSettings];
              return (
                <label key={item.key} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card cursor-pointer hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${item.color}-500/10 rounded-lg`}>
                      <Icon className={`w-5 h-5 text-${item.color}-600 dark:text-${item.color}-400`} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <ToggleSwitch enabled={enabled} onChange={() => setNotifSettings({ ...notifSettings, [item.key]: !enabled })} />
                </label>
              );
            })}
          </div>
        </PageCard>

        {/* Appearance */}
        <PageCard title="Tampilan Sistem" description="Sesuaikan tema dan bahasa aplikasi">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg">
              <div className="flex items-center gap-3">
                <Palette className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Tema Gelap (Dark Mode)</span>
              </div>
              <ToggleSwitch enabled={appSettings.darkMode} onChange={() => setAppSettings({ ...appSettings, darkMode: !appSettings.darkMode })} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border-t border-border">
              <div className="flex items-center gap-3">
                <Laptop className="w-5 h-5 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium text-foreground block">Compact Mode</span>
                  <span className="text-[10px] text-muted-foreground">Tampilan UI yang lebih padat</span>
                </div>
              </div>
              <ToggleSwitch enabled={appSettings.compactMode} onChange={() => setAppSettings({ ...appSettings, compactMode: !appSettings.compactMode })} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border-t border-border">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Bahasa Sistem</span>
              </div>
              <select
                value={appSettings.language}
                onChange={(e) => setAppSettings({ ...appSettings, language: e.target.value })}
                className="text-sm border border-border rounded-md px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English (US)</option>
                <option value="ar">العربية (Arabic)</option>
              </select>
            </div>
          </div>
        </PageCard>

        {/* Chart Settings */}
        <PageCard title="Preferensi Tampilan Grafik" description="Sesuaikan gaya visual chart analytics dashboard">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <PieChart className="w-3.5 h-3.5" /> Tema Grafik
              </label>
              <select
                value={chartSettings.theme}
                onChange={(e) => setChartSettings({ ...chartSettings, theme: e.target.value })}
                className="w-full text-sm border border-border rounded-lg px-3 py-2.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="modern">Modern SaaS (Default)</option>
                <option value="minimal">Minimal Clean</option>
                <option value="rounded">Rounded Playful</option>
                <option value="glassmorphism">Glassmorphism</option>
                <option value="dark-analytics">Dark Analytics</option>
                <option value="soft-color">Soft Pastel Colors</option>
              </select>
            </div>
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 mb-2">
                <Activity className="w-3.5 h-3.5" /> Efek Visual
              </label>
              {[
                { key: 'animation', label: 'Animasi Chart (Smooth Transition)' },
                { key: 'gradient', label: 'Fill Gradient Style' },
                { key: 'smoothLines', label: 'Smooth Curves (Line Chart)' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <ToggleSwitch
                    enabled={(chartSettings as unknown as Record<string, unknown>)[key] as boolean}
                    onChange={() => setChartSettings({ ...chartSettings, [key]: !(chartSettings[key as keyof ChartSettings]) })}
                  />
                </div>
              ))}
            </div>
          </div>
        </PageCard>

        {/* System Info */}
        <div className="lg:col-span-2">
          <PageCard title="Informasi Sistem" description="Status dan spesifikasi server saat ini">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Versi Aplikasi', value: 'v2.4.1 (Stable)', extra: <StatusBadge status="aktif" variant="success" className="text-[9px] px-1.5 py-0" /> },
                { label: 'Status Server', value: 'Online (99.9% Uptime)', icon: <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />, className: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Koneksi Database', value: 'Connected (32ms)', icon: <span className="w-4 h-4 text-blue-500" /> },
                { label: 'Backup Terakhir', value: 'Hari ini, 03:00 WIB', icon: <RotateCcw className="w-4 h-4 text-muted-foreground" /> },
              ].map((info) => (
                <div key={info.label} className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground font-medium uppercase">{info.label}</span>
                  <span className={`text-sm font-bold flex items-center gap-1.5 ${info.className || 'text-foreground'}`}>
                    {info.icon}{info.value} {info.extra}
                  </span>
                </div>
              ))}
            </div>
          </PageCard>
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <div
      className={`relative inline-flex h-5 w-9 items-center rounded-full cursor-pointer transition-colors ${enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
      onClick={onChange}
    >
      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-1'}`} />
    </div>
  );
}
