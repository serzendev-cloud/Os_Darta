import { auditLogService } from '@/lib/db/services/auditLog';

export type FreezeStatus = 'active' | 'requested_by_walikelas' | 'suspended_by_walikelas' | 'suspended_by_wali' | 'blocked';
export type FreezeDuration = '1_day' | '3_days' | '7_days' | 'permanent';

export interface WalletFreezeState {
  santriId: string;
  canteenStatus: FreezeStatus;
  freezeRequestedBy?: string;
  freezeRequestedAt?: string;
  freezeReason?: string;
  suspendedBy?: string;
  suspendedReason?: string;
  freezeDuration?: FreezeDuration;
  freezeExpiresAt?: string;
}

export function calculateExpiration(duration: FreezeDuration): string | undefined {
  const now = new Date();
  if (duration === '1_day') {
    return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  }
  if (duration === '3_days') {
    return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  }
  if (duration === '7_days') {
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  return undefined; // permanent
}

export const walletFreezeService = {
  /**
   * Wali Kelas submits a freeze request (Status -> 'requested_by_walikelas')
   * Wali Kelas MUST NOT directly freeze or set final duration.
   */
  requestFreezeByWaliKelas(
    current: WalletFreezeState,
    requesterName: string,
    reason?: string
  ): WalletFreezeState {
    const updated: WalletFreezeState = {
      ...current,
      canteenStatus: 'requested_by_walikelas',
      freezeRequestedBy: requesterName,
      freezeRequestedAt: new Date().toISOString(),
      freezeReason: reason || 'Pengajuan nonaktif belanja dari Wali Kelas',
    };

    auditLogService.log({
      actorId: requesterName,
      actorName: requesterName,
      actorRole: 'wali_kelas',
      action: 'update',
      entityType: 'santri',
      entityId: current.santriId,
      metadata: { detail: `Wali Kelas ${requesterName} mengajukan freeze Uang Saku santri ID ${current.santriId}` },
    });

    return updated;
  },

  /**
   * Wali Santri directly freezes Uang Saku with selected duration (Status -> 'suspended_by_wali')
   * Highest Authority — does not require approval.
   */
  directFreezeByWaliSantri(
    current: WalletFreezeState,
    waliName: string,
    duration: FreezeDuration,
    reason?: string
  ): WalletFreezeState {
    const expiresAt = calculateExpiration(duration);

    const updated: WalletFreezeState = {
      ...current,
      canteenStatus: 'suspended_by_wali',
      suspendedBy: waliName,
      suspendedReason: reason || 'Nonaktifkan belanja langsung oleh Wali Santri',
      freezeDuration: duration,
      freezeExpiresAt: expiresAt,
      freezeRequestedBy: undefined,
    };

    auditLogService.log({
      actorId: waliName,
      actorName: waliName,
      actorRole: 'wali',
      action: 'update',
      entityType: 'santri',
      entityId: current.santriId,
      metadata: { detail: `Wali Santri ${waliName} membekukan Uang Saku santri ID ${current.santriId} (Durasi: ${duration})` },
    });

    return updated;
  },

  /**
   * Wali Santri approves Wali Kelas freeze request and selects final freeze duration.
   */
  approveFreezeRequest(
    current: WalletFreezeState,
    waliName: string,
    duration: FreezeDuration
  ): WalletFreezeState {
    const expiresAt = calculateExpiration(duration);

    const updated: WalletFreezeState = {
      ...current,
      canteenStatus: 'suspended_by_wali',
      suspendedBy: waliName,
      suspendedReason: `Disetujui dari pengajuan Wali Kelas (${current.freezeRequestedBy || 'Wali Kelas'})`,
      freezeDuration: duration,
      freezeExpiresAt: expiresAt,
      freezeRequestedBy: undefined,
    };

    auditLogService.log({
      actorId: waliName,
      actorName: waliName,
      actorRole: 'wali',
      action: 'approve',
      entityType: 'santri',
      entityId: current.santriId,
      metadata: { detail: `Wali Santri ${waliName} menyetujui pengajuan freeze dari Wali Kelas untuk santri ID ${current.santriId} (Durasi: ${duration})` },
    });

    return updated;
  },

  /**
   * Wali Santri rejects Wali Kelas freeze request (Status returns to 'active')
   */
  rejectFreezeRequest(
    current: WalletFreezeState,
    waliName: string,
    rejectionReason?: string
  ): WalletFreezeState {
    const updated: WalletFreezeState = {
      ...current,
      canteenStatus: 'active',
      freezeRequestedBy: undefined,
      freezeRequestedAt: undefined,
      freezeReason: undefined,
    };

    auditLogService.log({
      actorId: waliName,
      actorName: waliName,
      actorRole: 'wali',
      action: 'reject',
      entityType: 'santri',
      entityId: current.santriId,
      metadata: { detail: `Wali Santri ${waliName} menolak pengajuan freeze dari Wali Kelas untuk santri ID ${current.santriId}. Alasan: ${rejectionReason || 'Ditolak Wali Santri'}` },
    });

    return updated;
  },

  /**
   * Wali Santri unfreezes (re-activates) Uang Saku.
   */
  unfreezeByWaliSantri(current: WalletFreezeState, waliName: string): WalletFreezeState {
    const updated: WalletFreezeState = {
      ...current,
      canteenStatus: 'active',
      suspendedBy: undefined,
      suspendedReason: undefined,
      freezeDuration: undefined,
      freezeExpiresAt: undefined,
    };

    auditLogService.log({
      actorId: waliName,
      actorName: waliName,
      actorRole: 'wali',
      action: 'update',
      entityType: 'santri',
      entityId: current.santriId,
      metadata: { detail: `Wali Santri ${waliName} mengaktifkan kembali Uang Saku santri ID ${current.santriId}` },
    });

    return updated;
  },
};
