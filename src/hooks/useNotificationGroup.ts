'use client';

import { useMemo } from 'react';
import type { Notification } from '@/types';

export interface NotificationGroup {
  label: string;
  items: Notification[];
}

export function useNotificationGroup(notifications: Notification[]): NotificationGroup[] {
  return useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);

    const groups: { label: string; items: Notification[] }[] = [
      { label: 'Hari Ini', items: [] },
      { label: 'Kemarin', items: [] },
      { label: 'Minggu Ini', items: [] },
      { label: 'Lebih Lama', items: [] },
    ];

    for (const n of notifications) {
      const d = new Date(n.createdAt || '');
      if (d >= today) {
        groups[0].items.push(n);
      } else if (d >= yesterday) {
        groups[1].items.push(n);
      } else if (d >= weekStart) {
        groups[2].items.push(n);
      } else {
        groups[3].items.push(n);
      }
    }

    return groups.filter((g) => g.items.length > 0);
  }, [notifications]);
}

// PWA push notification preference types (future use)
export interface NotificationPreferences {
  pelanggaran: boolean;
  hukuman: boolean;
  quest: boolean;
  governance: boolean;
  health: boolean;
  sistem: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  pelanggaran: true,
  hukuman: true,
  quest: true,
  governance: true,
  health: true,
  sistem: true,
};
