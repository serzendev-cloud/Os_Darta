'use client';

import type { CurriculumProgram } from '@/lib/store/curriculum-store';
import { useAuthStore } from '@/store/auth-store';
import { 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AcademicContextPanelProps {
  program: CurriculumProgram;
  progressPercentage?: number;
  completedCount?: number;
  totalCount?: number;
  className?: string;
}

export function AcademicContextPanel({
  program,
  progressPercentage = 80,
  completedCount = 4,
  totalCount = 4,
  className,
}: AcademicContextPanelProps) {
  const { user } = useAuthStore();

  const getRoleLabel = () => {
    if (!user) return 'Administrator';
    switch (user.role) {
      case 'super_admin': return 'Super Admin';
      case 'developer': return 'System Architect';
      case 'admin': return 'Admin Akademik';
      case 'kepala_kesiswaan': return 'Waka Kurikulum';
      default: return 'Administrator';
    }
  };

  const getScopeLabel = () => {
    switch (program.typeCategory) {
      case 'formal': return 'Akademik Formal (Kemag/Kemenag)';
      case 'pesantren': return 'Akademik Pesantren (Diniyah)';
      case 'quran': return 'Akademik Qur\'an & Tahfidz';
      default: return 'Akademik Khusus Pesantren';
    }
  };

  const versionDisplay = program.version || 'v1.0 Draft';
  const lifecycleStatus = program.lifecycleStatus || (program.status === 'active' ? 'published' : 'draft');
  const tahunAjaranDisplay = program.tahunAjaran || 'TA 2025/2026';

  const getStatusBadge = () => {
    switch (lifecycleStatus) {
      case 'published':
        return {
          label: 'PUBLISHED',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: CheckCircle2,
        };
      case 'review':
        return {
          label: 'REVIEW',
          color: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          icon: Clock,
        };
      case 'archived':
        return {
          label: 'ARCHIVED',
          color: 'bg-stone-500/20 text-stone-300 border-stone-500/40',
          icon: AlertCircle,
        };
      default:
        return {
          label: 'DRAFT',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: FileCheck,
        };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  return (
    <div
      className={cn(
        'p-5 rounded-3xl bg-stone-900 text-white border border-amber-500/30 shadow-xl space-y-4 relative overflow-hidden',
        className
      )}
    >
      {/* Background Accent Gradient */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-4">
        {/* User Role & Scope Identity */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-800 border border-stone-700 text-amber-400 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Role: {getRoleLabel()}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-800 border border-stone-700 text-stone-300 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-stone-400" />
            <span>Scope: {getScopeLabel()}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-800 border border-stone-700 text-stone-300 text-xs font-mono font-medium">
            <span>{tahunAjaranDisplay}</span>
          </div>
        </div>

        {/* Status Lifecycle Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Versi:</span>
          <span className="text-xs font-mono font-extrabold text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-md border border-amber-500/30">
            {versionDisplay}
          </span>
          <span
            className={cn(
              'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold border',
              statusBadge.color
            )}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusBadge.label}</span>
          </span>
        </div>
      </div>

      {/* Program Summary & Readiness Progress */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-7 space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {program.code}
            </span>
            <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
              {program.name}
            </h2>
          </div>
          <p className="text-stone-300 text-xs line-clamp-1">
            {program.description || 'Pusat Konfigurasi & Pengelolaan Kurikulum Akademik'}
          </p>
        </div>

        {/* Progress Bar & Readiness Indicator */}
        <div className="md:col-span-5 bg-stone-800/80 p-3.5 rounded-2xl border border-stone-700/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Readiness Kurikulum</span>
            </span>
            <span className="font-mono font-black text-amber-400">
              {progressPercentage}% ({completedCount}/{totalCount} Domain)
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-stone-950 overflow-hidden p-0.5 border border-stone-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500 transition-all duration-500 shadow-sm"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
