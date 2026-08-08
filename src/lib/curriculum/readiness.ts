import type { CurriculumProgram } from '@/lib/store/curriculum-store';
import type { MasterJenjang, MasterTingkat } from '@/types';
import type { Mapel } from '@/types/academic';

export interface ReadinessDomain {
  id: string;
  label: string;
  description: string;
  icon: string;
  isComplete: boolean;
  isAvailable: boolean; // false if module is coming soon
  dependencies: string[];
  dependencyLabels: string[];
  href?: string;
  tabKey?: string;
}

export interface CurriculumReadiness {
  domains: ReadinessDomain[];
  completedCount: number;
  availableCount: number;
  totalCount: number;
  percentage: number;
}

export function calculateCurriculumReadiness(
  program: CurriculumProgram | null,
  jenjangList: MasterJenjang[] = [],
  tingkatList: MasterTingkat[] = [],
  mapelList: Mapel[] = []
): CurriculumReadiness {
  if (!program) {
    return {
      domains: [],
      completedCount: 0,
      availableCount: 0,
      totalCount: 0,
      percentage: 0,
    };
  }

  // 1. Informasi Program
  const isInfoComplete = Boolean(
    program.name && program.code && program.description && program.typeCategory
  );

  // 2. Struktur Akademik (has jenjang & tingkat for this program instansi)
  const isStructureComplete = jenjangList.length > 0 && tingkatList.length > 0;

  // 3. Mata Pelajaran (has mapel items)
  const isMapelComplete = isStructureComplete && mapelList.length > 0;

  // 4. Target Pembelajaran (Coming Soon)
  const isTargetComplete = false;

  // 5. Template Jurnal (Coming Soon)
  const isJurnalComplete = false;

  // 6. Sistem Penilaian (skalaPenilaian & kkmMin set)
  const isGradingComplete = isMapelComplete && Boolean(program.skalaPenilaian && program.kkmMin);

  // 7. Kalender Akademik (Coming Soon)
  const isCalendarComplete = false;

  const domains: ReadinessDomain[] = [
    {
      id: 'general',
      label: 'Informasi Program',
      description: 'Identitas, kode unik, dan deskripsi program',
      icon: 'Settings',
      isComplete: isInfoComplete,
      isAvailable: true,
      dependencies: [],
      dependencyLabels: [],
      tabKey: 'general',
    },
    {
      id: 'structure',
      label: 'Struktur Akademik',
      description: 'Hirarki master jenjang, tingkat & rombel kelas',
      icon: 'GraduationCap',
      isComplete: isStructureComplete,
      isAvailable: true,
      dependencies: ['general'],
      dependencyLabels: ['Informasi Program'],
      tabKey: 'structure',
    },
    {
      id: 'mapel',
      label: 'Mata Pelajaran',
      description: 'Daftar kurikulum mata pelajaran per-tingkat',
      icon: 'BookOpen',
      isComplete: isMapelComplete,
      isAvailable: true,
      dependencies: ['structure'],
      dependencyLabels: ['Struktur Akademik'],
      tabKey: 'mapel',
    },
    {
      id: 'target',
      label: 'Target Pembelajaran',
      description: 'Capaian pembelajaran & modul KD/CP',
      icon: 'Target',
      isComplete: isTargetComplete,
      isAvailable: false, // Coming soon
      dependencies: ['mapel'],
      dependencyLabels: ['Mata Pelajaran'],
    },
    {
      id: 'jurnal',
      label: 'Template Jurnal',
      description: 'Format jurnal KBM & presensi guru',
      icon: 'FileText',
      isComplete: isJurnalComplete,
      isAvailable: false, // Coming soon
      dependencies: ['mapel'],
      dependencyLabels: ['Mata Pelajaran'],
    },
    {
      id: 'grading',
      label: 'Sistem Penilaian',
      description: 'Skala nilai, KKM min, & format raport',
      icon: 'Award',
      isComplete: isGradingComplete,
      isAvailable: true,
      dependencies: ['mapel'],
      dependencyLabels: ['Mata Pelajaran'],
      tabKey: 'grading',
    },
    {
      id: 'calendar',
      label: 'Kalender Akademik',
      description: 'Jadwal kegiatan semester, ujian & libur',
      icon: 'Calendar',
      isComplete: isCalendarComplete,
      isAvailable: false, // Coming soon
      dependencies: [],
      dependencyLabels: [],
    },
  ];

  // Exclude coming-soon (isAvailable: false) domains from percentage denominator
  const availableDomains = domains.filter((d) => d.isAvailable);
  const completedCount = availableDomains.filter((d) => d.isComplete).length;
  const availableCount = availableDomains.length;
  const totalCount = domains.length;
  const percentage = Math.round((completedCount / availableCount) * 100);

  return {
    domains,
    completedCount,
    availableCount,
    totalCount,
    percentage,
  };
}
