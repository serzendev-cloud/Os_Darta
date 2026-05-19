'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { useAuth } from '@/hooks';
import { AccountTab } from './_components/AccountTab';
import { SystemTab } from './_components/SystemTab';
import type { UserRole } from '@/types';

type TabKey = 'account' | 'governance' | 'features' | 'system';

interface Tab {
  key: TabKey;
  label: string;
  roles: UserRole[];
}

const tabs: Tab[] = [
  { key: 'account', label: 'Akun Saya', roles: ['admin', 'musyrif', 'wali', 'santri', 'staff', 'kepala_kesiswaan', 'guru', 'wali_kelas', 'alumni'] },
  { key: 'governance', label: 'Governance', roles: ['admin', 'kepala_kesiswaan'] },
  { key: 'features', label: 'Fitur', roles: ['admin'] },
  { key: 'system', label: 'Sistem', roles: ['admin'] },
];

export default function PengaturanPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('account');
  const [isSaving, setIsSaving] = useState(false);

  const [notifSettings, setNotifSettings] = useState({ email: true, whatsapp: true, push: false });
  const [appSettings, setAppSettings] = useState({ darkMode: true, compactMode: false, language: 'id' });
  const [chartSettings, setChartSettings] = useState({ theme: 'modern', animation: true, gradient: true, smoothLines: true });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  };

  const handleReset = () => {
    setNotifSettings({ email: true, whatsapp: true, push: false });
    setAppSettings({ darkMode: true, compactMode: false, language: 'id' });
    setChartSettings({ theme: 'modern', animation: true, gradient: true, smoothLines: true });
  };

  const visibleTabs = tabs.filter((t) => user?.role && t.roles.includes(user.role));

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <PageHeader
        title="Pengaturan Sistem"
        description="Konfigurasi akun pribadi dan preferensi aplikasi Anda"
      />

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'account' && (
        <AccountTab
          notifSettings={notifSettings}
          setNotifSettings={setNotifSettings}
          appSettings={appSettings}
          setAppSettings={setAppSettings}
          chartSettings={chartSettings}
          setChartSettings={setChartSettings}
          handleSave={handleSave}
          handleReset={handleReset}
          isSaving={isSaving}
        />
      )}

      {activeTab === 'governance' && (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          Pengaturan governance akan tersedia di update berikutnya.
        </div>
      )}

      {activeTab === 'features' && (
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          Pengaturan fitur akan tersedia di update berikutnya.
        </div>
      )}

      {activeTab === 'system' && <SystemTab />}
    </div>
  );
}
