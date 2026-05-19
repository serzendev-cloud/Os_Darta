// ========================================
// HIERARCHY ENGINE HELPERS
// System level (progressionIndex) ≠ display level (Jenjang + Tingkat).
// All UI must use these formatters — never render progressionIndex raw.
// ========================================

import type { MasterTingkat, Instansi } from '@/types';
import { INSTANSI_LABEL } from '@/types';

/** Sort items by progressionIndex ascending — safe for all instansi. */
export function sortByProgression<T extends { progressionIndex: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.progressionIndex - b.progressionIndex);
}

/** Get display-friendly instansi label. */
export function getInstansiLabel(instansi: Instansi): string {
  return INSTANSI_LABEL[instansi] ?? instansi;
}

/**
 * Resolve display level from system level.
 * System level = progressionIndex (globally unique integer per institusi).
 * Display level = "Tingkat X" or "Jenjang X — Tingkat Y".
 */
export function resolveDisplayLevel(progressionIndex: number, jenjangName?: string): string {
  if (jenjangName) {
    return `${jenjangName} — Tingkat ${progressionIndex}`;
  }
  return `Tingkat ${progressionIndex}`;
}

/** Format progression index as a standalone display label. */
export function formatTingkatLabel(tingkatLabel: string, jenjangName?: string): string {
  if (jenjangName) {
    return `${jenjangName} - ${tingkatLabel}`;
  }
  return tingkatLabel;
}

/** Group tingkat list by jenjangId for structured display. */
export function groupByJenjang(
  tingkatList: MasterTingkat[],
  jenjangMap: Record<string, string>,
): Map<string, MasterTingkat[]> {
  const grouped = new Map<string, MasterTingkat[]>();
  for (const tingkat of tingkatList) {
    const jenjangName = jenjangMap[tingkat.jenjangId] ?? tingkat.jenjangId;
    const existing = grouped.get(jenjangName);
    if (existing) {
      existing.push(tingkat);
    } else {
      grouped.set(jenjangName, [tingkat]);
    }
  }
  // Sort each group by progressionIndex
  for (const [, items] of grouped) {
    items.sort((a, b) => a.progressionIndex - b.progressionIndex);
  }
  return grouped;
}
