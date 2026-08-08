'use client';

import { useState } from 'react';
import { PageCard } from '@/components/shared/page-header';
import { 
  Activity, Server, Database, AlertTriangle, ShieldCheck, 
  Cpu, HardDrive, ScrollText, CheckCircle2, RefreshCw, Layers
} from 'lucide-react';

interface ResourceMetric {
  tenantName: string;
  subdomain: string;
  activeUsersCount: number;
  bandwidthMb: number;
  storageGb: number;
  cpuUsagePct: number;
  status: 'Optimal' | 'High Traffic' | 'Noisy Neighbor Warning';
}

interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  details: string;
  ipAddress: string;
}

const mockResourceUsage: ResourceMetric[] = [];
const mockAuditLogs: AuditLogItem[] = [];

export default function SaasInfraLogPage() {
  const [resources, setResources] = useState<ResourceMetric[]>(mockResourceUsage);
  const [logs, setLogs] = useState<AuditLogItem[]>(mockAuditLogs);

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-emerald-950 to-stone-900 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
            <Activity className="w-3.5 h-3.5" />
            <span>Pillar 5 — Infrastructure Monitoring & Audit Trail</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Pemantauan Infrastruktur & Log Sistem SaaS
          </h1>
          <p className="text-stone-300 text-xs md:text-sm max-w-2xl">
            Pemantauan beban bandwidth, penggunaan memori per-tenant untuk pencegahan *noisy neighbor problem*, catatan error real-time, dan jejak audit keamanan.
          </p>
        </div>
      </div>

      {/* Resource Usage Table (Prevent Noisy Neighbor Problem) */}
      <PageCard
        title="Pemantauan Sumber Daya & Bandwidth Per-Tenant"
        description="Mencegah masalah 'noisy neighbor' dengan memantau konsumsi CPU, Storage, dan Traffic per pesantren"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Pesantren & Subdomain</th>
                <th className="py-3 px-4">Pengguna Aktif</th>
                <th className="py-3 px-4">Bandwidth / Bln</th>
                <th className="py-3 px-4">Penyimpanan (Storage)</th>
                <th className="py-3 px-4">Beban CPU Server</th>
                <th className="py-3 px-4 text-right">Status Server</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200 font-medium">
              {resources.map((r, idx) => (
                <tr key={idx} className="hover:bg-stone-50/80 dark:hover:bg-stone-800/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-stone-900 dark:text-white">{r.tenantName}</div>
                    <div className="text-stone-400 text-[11px] font-mono">{r.subdomain}</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-stone-800 dark:text-stone-200">
                    {r.activeUsersCount} Pengguna
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                    {r.bandwidthMb} MB
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-stone-700 dark:text-stone-300">
                    {r.storageGb} GB
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2 max-w-[120px]">
                      <div className="flex-1 bg-stone-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${r.cpuUsagePct > 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${r.cpuUsagePct}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-bold">{r.cpuUsagePct}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      r.status === 'Optimal' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageCard>

      {/* Global Audit Trail */}
      <PageCard
        title="Jejak Audit Keamanan (Global Audit Trail)"
        description="Catatan aktivitas kritis pengubah status tenant, paket billing, dan integrasi API"
      >
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900 dark:text-white">{log.actor}</span>
                  <span className="text-stone-400">•</span>
                  <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 uppercase">{log.action}</span>
                  <span className="text-stone-400">•</span>
                  <span className="font-semibold text-stone-700 dark:text-stone-300">{log.target}</span>
                </div>
                <div className="text-stone-500">{log.details}</div>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-stone-400 font-mono shrink-0">
                <span>{log.timestamp}</span>
                <span>IP: {log.ipAddress}</span>
              </div>
            </div>
          ))}
        </div>
      </PageCard>
    </div>
  );
}
