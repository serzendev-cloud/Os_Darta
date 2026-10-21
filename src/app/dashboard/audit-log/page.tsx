'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageCard } from '@/components/shared/page-header';
import { ScrollText, Camera, ArrowRight, RefreshCw, User } from 'lucide-react';

interface SystemAuditLog {
  id: string;
  action: string;
  actorName: string;
  actorRole: string;
  targetEntity: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function AuditLogPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<SystemAuditLog[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/finance/audit-cctv/timeline');
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setLogs(json.data.recentAuditLogs || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLogs();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleManualRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance/audit-cctv/timeline');
      const json = await res.json();
      if (json.success && json.data) {
        setLogs(json.data.recentAuditLogs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Featured Banner linking to Financial CCTV */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 to-slate-900 border border-indigo-500/20 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold">Audit Trail Finansial & Digital CCTV</h2>
          </div>
          <p className="text-sm text-slate-300">
            Akses timeline pengawasan visual, rekonsiliasi otomatis, deteksi anomali, dan persetujuan refund.
          </p>
        </div>
        <Link
          href="/dashboard/keuangan/audit-cctv"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium text-sm transition shadow-md"
        >
          <span>Buka CCTV Finansial</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <PageCard
        title="Jejak Audit Sistem Terpadu"
        description="Pencatatan aktivitas sistem, perubahan data, dan verifikasi integritas multi-tenant."
        action={
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-xs font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
        }
      >
        <div className="divide-y border rounded-xl overflow-hidden mt-2">
          {logs.map((log) => (
            <div key={log.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 hover:bg-muted/30 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{log.action}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    ({new Date(log.createdAt).toLocaleString('id-ID')})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="w-3.5 h-3.5" />
                  <span>{log.actorName}</span>
                  <span>•</span>
                  <span className="font-mono text-indigo-500">{log.actorRole}</span>
                  <span>•</span>
                  <span>Target: {log.targetEntity}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {log.amount > 0 && (
                  <span className="font-semibold text-xs text-emerald-600">
                    Rp {log.amount.toLocaleString('id-ID')}
                  </span>
                )}
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">
                  {log.status}
                </span>
              </div>
            </div>
          ))}

          {logs.length === 0 && (
            <div className="p-12 text-center text-muted-foreground text-sm space-y-2">
              <ScrollText className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p>Belum ada log sistem terkini</p>
            </div>
          )}
        </div>
      </PageCard>
    </div>
  );
}
