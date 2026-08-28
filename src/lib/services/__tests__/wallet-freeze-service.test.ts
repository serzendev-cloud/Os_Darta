import { describe, it, expect } from 'vitest';
import { walletFreezeService, WalletFreezeState } from '../wallet-freeze-service';

describe('walletFreezeService Authority & Lifecycle', () => {
  const baseWallet: WalletFreezeState = {
    santriId: 'santri-001',
    canteenStatus: 'active',
  };

  it('Wali Kelas request freeze sets canteenStatus to requested_by_walikelas', () => {
    const result = walletFreezeService.requestFreezeByWaliKelas(baseWallet, 'Ustadz Ahmad', 'Boros Jajan');
    expect(result.canteenStatus).toBe('requested_by_walikelas');
    expect(result.freezeRequestedBy).toBe('Ustadz Ahmad');
    expect(result.freezeReason).toBe('Boros Jajan');
  });

  it('Wali Santri direct freeze sets canteenStatus to suspended_by_wali with duration', () => {
    const result = walletFreezeService.directFreezeByWaliSantri(baseWallet, 'Bapak Budi', '3_days', 'Hukuman Belanja');
    expect(result.canteenStatus).toBe('suspended_by_wali');
    expect(result.suspendedBy).toBe('Bapak Budi');
    expect(result.freezeDuration).toBe('3_days');
    expect(result.freezeExpiresAt).toBeDefined();
  });

  it('Wali Santri approves Wali Kelas freeze request and sets final duration', () => {
    const requested = walletFreezeService.requestFreezeByWaliKelas(baseWallet, 'Ustadz Ahmad');
    const approved = walletFreezeService.approveFreezeRequest(requested, 'Bapak Budi', '7_days');

    expect(approved.canteenStatus).toBe('suspended_by_wali');
    expect(approved.suspendedBy).toBe('Bapak Budi');
    expect(approved.freezeDuration).toBe('7_days');
    expect(approved.freezeExpiresAt).toBeDefined();
  });

  it('Wali Santri rejects Wali Kelas freeze request and returns wallet to active', () => {
    const requested = walletFreezeService.requestFreezeByWaliKelas(baseWallet, 'Ustadz Ahmad');
    const rejected = walletFreezeService.rejectFreezeRequest(requested, 'Bapak Budi', 'Santri butuh beli obat');

    expect(rejected.canteenStatus).toBe('active');
    expect(rejected.freezeRequestedBy).toBeUndefined();
  });

  it('Wali Santri unfreezes a suspended wallet', () => {
    const frozen = walletFreezeService.directFreezeByWaliSantri(baseWallet, 'Bapak Budi', 'permanent');
    const unfrozen = walletFreezeService.unfreezeByWaliSantri(frozen, 'Bapak Budi');

    expect(unfrozen.canteenStatus).toBe('active');
    expect(unfrozen.suspendedBy).toBeUndefined();
  });
});
