/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterForm } from '../../src/app/register/RegisterForm';
import RegisterPage from '../../src/app/register/page';

describe('WP-SAAS-REGISTRATION-IMPLEMENTATION-001 — Mobile-First Registration UI Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ── 1. Form Field Rendering ───────────────────────────────────────────────
  it('1. Renders all essential registration fields with semantic labels and placeholders', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText(/Nama Pesantren \/ Instansi/i)).toBeDefined();
    expect(screen.getByLabelText(/Subdomain Akses Pesantren/i)).toBeDefined();
    expect(screen.getByLabelText(/Nama Penanggung Jawab/i)).toBeDefined();
    expect(screen.getByLabelText(/Alamat Email Resmi Administrator/i)).toBeDefined();
    expect(screen.getByLabelText(/Nomor Telepon \/ WhatsApp/i)).toBeDefined();
    expect(screen.getByLabelText(/Kota \/ Kabupaten Lokasi/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Daftarkan Instansi Sekarang/i })).toBeDefined();
  });

  // ── 2. Live Subdomain Preview & Slug Auto-Suggestion ─────────────────────
  it('2. Dynamically updates live subdomain preview and auto-suggests slug from institution name', () => {
    render(<RegisterForm />);

    const nameInput = screen.getByLabelText(/Nama Pesantren \/ Instansi/i);
    const slugInput = screen.getByLabelText(/Subdomain Akses Pesantren/i);

    fireEvent.change(nameInput, { target: { value: 'Pesantren Al-Hikmah' } });

    // Expect slug auto-suggested
    expect((slugInput as HTMLInputElement).value).toBe('pesantren-al-hikmah');
    expect(screen.getByText(/https:\/\/pesantren-al-hikmah\.madev\.id/i)).toBeDefined();

    // Manual slug customization
    fireEvent.change(slugInput, { target: { value: 'alhikmah' } });
    expect((slugInput as HTMLInputElement).value).toBe('alhikmah');
    expect(screen.getByText(/https:\/\/alhikmah\.madev\.id/i)).toBeDefined();
  });

  // ── 3. Client Validation ──────────────────────────────────────────────────
  it('3. Prevents submission and displays client error hints when required fields are empty', async () => {
    render(<RegisterForm />);

    const submitBtn = screen.getByRole('button', { name: /Daftarkan Instansi Sekarang/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Nama instansi pesantren wajib diisi/i)).toBeDefined();
    expect(await screen.findByText(/Subdomain \/ Slug wajib diisi/i)).toBeDefined();
    expect(await screen.findByText(/Nama pengurus \/ penanggung jawab wajib diisi/i)).toBeDefined();
    expect(await screen.findByText(/Alamat email wajib diisi/i)).toBeDefined();
  });

  // ── 4. API Error Handling ─────────────────────────────────────────────────
  it('4. Displays error alert when server returns 409 Conflict (e.g. duplicate slug)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        success: false,
        error: 'Conflict',
        field: 'slug',
        message: "Subdomain / Slug 'alhikmah' sudah digunakan oleh pesantren lain.",
      }),
    } as any);

    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/Nama Pesantren \/ Instansi/i), { target: { value: 'Pesantren Al-Hikmah' } });
    fireEvent.change(screen.getByLabelText(/Subdomain Akses Pesantren/i), { target: { value: 'alhikmah' } });
    fireEvent.change(screen.getByLabelText(/Nama Penanggung Jawab/i), { target: { value: 'Ustadz Ahmad' } });
    fireEvent.change(screen.getByLabelText(/Alamat Email Resmi Administrator/i), { target: { value: 'admin@alhikmah.sch.id' } });

    fireEvent.click(screen.getByRole('button', { name: /Daftarkan Instansi Sekarang/i }));

    expect(await screen.findByRole('alert')).toBeDefined();
    const conflictMsgs = await screen.findAllByText(/sudah digunakan oleh pesantren lain/i);
    expect(conflictMsgs.length).toBeGreaterThanOrEqual(1);
  });

  // ── 5. Successful Submission & Onboarding Handoff ─────────────────────────
  it('5. Successfully submits form and renders Onboarding Success State without secret leakage', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        success: true,
        message: 'Pendaftaran instansi "Pesantren Al-Hikmah" berhasil diproses.',
        data: {
          tenantName: 'Pesantren Al-Hikmah',
          tenantSlug: 'alhikmah',
          domain: 'alhikmah.madev.id',
          ownerEmail: 'admin@alhikmah.sch.id',
          status: 'PROVISIONED',
          nextStep: 'ONBOARDING',
        },
      }),
    } as any);

    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/Nama Pesantren \/ Instansi/i), { target: { value: 'Pesantren Al-Hikmah' } });
    fireEvent.change(screen.getByLabelText(/Subdomain Akses Pesantren/i), { target: { value: 'alhikmah' } });
    fireEvent.change(screen.getByLabelText(/Nama Penanggung Jawab/i), { target: { value: 'Ustadz Ahmad' } });
    fireEvent.change(screen.getByLabelText(/Alamat Email Resmi Administrator/i), { target: { value: 'admin@alhikmah.sch.id' } });

    fireEvent.click(screen.getByRole('button', { name: /Daftarkan Instansi Sekarang/i }));

    await waitFor(() => {
      expect(screen.getByText(/Pendaftaran Berhasil/i)).toBeDefined();
      expect(screen.getByText(/Pesantren Al-Hikmah/i)).toBeDefined();
      expect(screen.getByText(/https:\/\/alhikmah\.madev\.id/i)).toBeDefined();
      expect(screen.getByText(/Langkah Selanjutnya/i)).toBeDefined();
    });

    // Verify zero secret leakage on success card
    expect(screen.queryByText(/temporaryPassword/i)).toBeNull();
    expect(screen.queryByText(/password/i)).toBeNull();

    // Verify navigation links preserved
    expect(screen.getByRole('link', { name: /Masuk Portal/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Kembali ke Halaman Utama/i })).toBeDefined();
  });

  // ── 6. Full RegisterPage Composition ──────────────────────────────────────
  it('6. RegisterPage renders with correct page hierarchy and metadata elements', () => {
    render(<RegisterPage />);

    expect(screen.getByRole('heading', { name: /Daftar Instansi Pesantren/i })).toBeDefined();
    expect(screen.getByLabelText(/Nama Pesantren \/ Instansi/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Daftarkan Instansi Sekarang/i })).toBeDefined();
  });
});
