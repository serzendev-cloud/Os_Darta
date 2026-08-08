export interface CurriculumProgram {
  id: string;
  code: string;
  name: string;
  typeCategory: 'formal' | 'pesantren' | 'quran' | 'custom';
  description: string;
  status: 'active' | 'draft';
  totalJenjang: number;
  totalMapel: number;
  totalGuru: number;
  iconBg: string;
  // Advanced configuration attributes
  skalaPenilaian?: 'numeric_100' | 'predikat_syariah' | 'letter_af';
  kkmMin?: number;
  formatRaport?: 'pdf_standar' | 'pdf_tahfidz' | 'kitab_kuning';
  penanggungJawab?: string;
  catatanTambahan?: string;
  // Enterprise lifecycle & versioning extensions
  version?: string;
  lifecycleStatus?: 'draft' | 'review' | 'published' | 'archived';
  tahunAjaran?: string;
  lastModified?: string;
  publishedAt?: string;
}

export const defaultCurriculumsList: CurriculumProgram[] = [
  {
    id: 'prog-formal',
    code: 'FORMAL-DEPAG',
    name: 'Akademik Formal',
    typeCategory: 'formal',
    description: 'Kurikulum pendidikan formal berijazah negara (MTs, MA, SMA, SMP)',
    status: 'active',
    totalJenjang: 3,
    totalMapel: 16,
    totalGuru: 12,
    iconBg: 'bg-blue-600',
    version: 'v2.1',
    lifecycleStatus: 'published',
    tahunAjaran: 'TA 2025/2026',
  },
  {
    id: 'prog-madin',
    code: 'PESANTREN-MADIN',
    name: 'Akademik Pesantren',
    typeCategory: 'pesantren',
    description: 'Kurikulum diniyah pesantren (Jenjang Tamhidi, Ibtida’i, Tsanawiyah, Aliyah)',
    status: 'active',
    totalJenjang: 4,
    totalMapel: 24,
    totalGuru: 18,
    iconBg: 'bg-amber-600',
    version: 'v1.0',
    lifecycleStatus: 'published',
    tahunAjaran: 'TA 2025/2026',
  },
  {
    id: 'prog-madqur',
    code: 'TAHFIDZ-MADQUR',
    name: 'Akademik Qur’an',
    typeCategory: 'quran',
    description: 'Program khusus tahsin, ziyadah hafalan 30 juz, murojaah, & matan tajwid',
    status: 'active',
    totalJenjang: 2,
    totalMapel: 8,
    totalGuru: 8,
    iconBg: 'bg-emerald-600',
    version: 'v1.2',
    lifecycleStatus: 'published',
    tahunAjaran: 'TA 2025/2026',
  },
];

const STORAGE_KEY = 'mahad_curriculum_programs_v1';
export const CURRICULUM_STORE_CHANGE_EVENT = 'mahad_curriculum_store_updated';

export function getStoredCurriculums(): CurriculumProgram[] {
  if (typeof window === 'undefined') return defaultCurriculumsList;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultCurriculumsList;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultCurriculumsList;
  } catch {
    return defaultCurriculumsList;
  }
}

export function saveStoredCurriculums(programs: CurriculumProgram[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(programs));
    // Broadcast custom event so sidebar updates in real-time instantly without page reload
    window.dispatchEvent(new Event('mahad_curriculum_store_updated'));
  } catch (e) {
    console.error('Failed to save curriculum store', e);
  }
}
