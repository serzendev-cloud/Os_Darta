import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SaasModulesPage from '@/app/dashboard/saas/modul-fitur/page';
import ModulFiturError from '@/app/dashboard/saas/modul-fitur/error';

describe.sequential('SaasModulesPage — Forensic Remediation Verification', () => {
  let fetchSpy: any;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('renders initial loading state without crashing', () => {
    fetchSpy.mockReturnValue(new Promise(() => {})); // Never resolves
    const { container } = render(<SaasModulesPage />);
    expect(container).toBeDefined();
    expect(screen.getByText(/Memuat data modul pesantren/i)).toBeDefined();
  });

  it('renders empty state gracefully when API returns empty tenant array', async () => {
    fetchSpy.mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        data: { tenants: [], total: 0 },
      }),
    } as Response));

    render(<SaasModulesPage />);
    await waitFor(() => {
      expect(screen.getByText(/Belum Ada Tenant Terdaftar/i)).toBeDefined();
    });
  });

  it('renders active database tenants with modules: undefined without throwing TypeError', async () => {
    const mockDbTenants = [
      {
        id: 't_1789252184367_rx9ze',
        name: 'Runtime Audit Actor Verification',
        slug: 'runtime-audit-actor-001',
        code: 'AUD01',
        subdomain: 'runtime-audit-actor-001.madev.id',
        location: 'Indonesia',
        ownerName: 'Admin Pesantren',
        ownerEmail: '-',
        ownerPhone: '-',
        plan: null,
        status: 'aktif',
        adminStatus: 'ACTIVE',
        santriCount: 0,
        createdAt: '2026-09-22',
        modules: undefined,
      },
    ];

    fetchSpy.mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        data: { tenants: mockDbTenants, total: 1 },
      }),
    } as Response));

    const { unmount } = render(<SaasModulesPage />);

    await waitFor(() => {
      expect(screen.getByText(/PILIH PESANTREN TARGET/i)).toBeDefined();
    });
    expect(screen.getAllByText(/Runtime Audit Actor Verification/i).length).toBeGreaterThan(0);

    expect(screen.getByText(/Kesantrian & Asrama/i)).toBeDefined();
    expect(screen.getByText(/Akademik & E-Rapor/i)).toBeDefined();
    expect(screen.getByText(/Keuangan & Auto SPP/i)).toBeDefined();
    unmount();
  });

  it('handles malformed or sparse tenant elements in API response defensively', async () => {
    const sparseList = [
      null,
      undefined,
      {
        id: 'valid-tenant',
        name: 'Valid Pesantren',
        subdomain: 'valid.madev.id',
        location: 'Indonesia',
        plan: 'Pro SaaS',
        modules: null,
      },
    ];

    fetchSpy.mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        data: { tenants: sparseList, total: 1 },
      }),
    } as Response));

    const { unmount } = render(<SaasModulesPage />);

    await waitFor(() => {
      expect(screen.getByText(/PILIH PESANTREN TARGET/i)).toBeDefined();
    });
    expect(screen.getAllByText(/Valid Pesantren/i).length).toBeGreaterThan(0);
    unmount();
  });

  it('allows toggling module state for current tenant', async () => {
    const mockDbTenants = [
      {
        id: 't_toggle',
        name: 'Toggle Test Pesantren',
        slug: 'toggle-test',
        code: 'TOG01',
        subdomain: 'toggle.madev.id',
        location: 'Indonesia',
        plan: 'Pro SaaS',
        modules: undefined,
      },
    ];

    fetchSpy.mockImplementation(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        data: { tenants: mockDbTenants, total: 1 },
      }),
    } as Response));

    const { unmount } = render(<SaasModulesPage />);

    await waitFor(() => {
      expect(screen.getAllByText(/Toggle Test Pesantren/i).length).toBeGreaterThan(0);
    });

    const toggleButtons = screen.getAllByRole('button', { name: /Matikan Modul|Aktifkan Modul/i });
    expect(toggleButtons.length).toBeGreaterThan(0);

    fireEvent.click(toggleButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/BERHASIL DIAKTIFKAN|DINONAKTIFKAN/i)).toBeDefined();
    });
    unmount();
  });

  it('renders local error boundary cleanly when an unhandled error occurs', () => {
    const mockReset = vi.fn();
    render(
      <ModulFiturError
        error={new Error("Cannot read properties of undefined (reading 'modules')")}
        reset={mockReset}
      />
    );

    expect(screen.getByText(/Gagal Memuat Konfigurasi Modul Fitur/i)).toBeDefined();
    expect(screen.getByText(/reading 'modules'/i)).toBeDefined();

    const retryBtn = screen.getByRole('button', { name: /Coba Muat Ulang/i });
    fireEvent.click(retryBtn);
    expect(mockReset).toHaveBeenCalledTimes(1);
  });
});
