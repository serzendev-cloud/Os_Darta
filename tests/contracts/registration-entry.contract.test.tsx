/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SaasLandingPage } from '../../src/components/landing/SaasLandingPage';
import RegisterPage from '../../src/app/register/page';

describe('WP-SAAS-REGISTRATION-ENTRY-001 — Public Tenant Registration Entry Point Tests', () => {
  beforeEach(() => {
    // Mock global fetch for company contact settings
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          companyName: 'SERZEN DEV',
          companyEmail: 'official@serzendev.cloud',
          companyPhone: '+6281200000000',
          companyWhatsApp: 'https://wa.me/6281200000000',
          companyWebsite: 'https://serzendev.cloud',
        },
      }),
    } as any);
  });

  // ── 1. Navbar Navigation ──────────────────────────────────────────────────
  describe('1. Navbar Registration Entry Point', () => {
    it('renders "Daftar Instansi" linking to /register in the navbar', async () => {
      await act(async () => {
        render(<SaasLandingPage />);
      });

      const registerLinks = screen.getAllByRole('link', { name: /Daftar Instansi/i });
      expect(registerLinks.length).toBeGreaterThanOrEqual(1);

      // Verify the navbar link specifically
      const navbarRegisterLink = registerLinks.find(
        (link) => link.getAttribute('href') === '/register'
      );
      expect(navbarRegisterLink).toBeDefined();
      expect(navbarRegisterLink?.getAttribute('href')).toBe('/register');
    });

    it('retains "Masuk Portal" linking to /login in the navbar', async () => {
      await act(async () => {
        render(<SaasLandingPage />);
      });

      const loginLinks = screen.getAllByRole('link', { name: /Masuk Portal/i });
      const navbarLoginLink = loginLinks.find(
        (link) => link.getAttribute('href') === '/login'
      );
      expect(navbarLoginLink).toBeDefined();
      expect(navbarLoginLink?.getAttribute('href')).toBe('/login');
    });

    it('retains "Konsultasi Demo" action in the navbar', async () => {
      await act(async () => {
        render(<SaasLandingPage />);
      });

      const consultationButtons = screen.getAllByRole('button', { name: /Konsultasi Demo/i });
      expect(consultationButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── 2. Hero CTA ───────────────────────────────────────────────────────────
  describe('2. Hero Section Registration CTA', () => {
    it('renders Primary CTA "Daftar Instansi Sekarang" pointing to /register', async () => {
      await act(async () => {
        render(<SaasLandingPage />);
      });

      const heroRegisterLinks = screen.getAllByRole('link', {
        name: /Daftar Instansi Sekarang/i,
      });
      expect(heroRegisterLinks.length).toBeGreaterThanOrEqual(1);

      const primaryHeroLink = heroRegisterLinks[0];
      expect(primaryHeroLink.getAttribute('href')).toBe('/register');
    });

    it('renders Secondary CTA "Masuk Portal Pesantren" pointing to /login', async () => {
      await act(async () => {
        render(<SaasLandingPage />);
      });

      const heroLoginLinks = screen.getAllByRole('link', {
        name: /Masuk Portal Pesantren/i,
      });
      expect(heroLoginLinks.length).toBeGreaterThanOrEqual(1);

      const secondaryHeroLink = heroLoginLinks[0];
      expect(secondaryHeroLink.getAttribute('href')).toBe('/login');
    });

    it('preserves "Konsultasikan Kebutuhan Pesantren" consultation button in Hero', async () => {
      await act(async () => {
        render(<SaasLandingPage />);
      });

      const consultButton = screen.getByRole('button', {
        name: /Konsultasikan Kebutuhan Pesantren/i,
      });
      expect(consultButton).toBeDefined();
    });
  });

  // ── 3. Footer Navigation ──────────────────────────────────────────────────
  describe('3. Footer Navigation', () => {
    it('includes "Daftar Instansi" pointing to /register in footer links', async () => {
      await act(async () => {
        render(<SaasLandingPage />);
      });

      const footerLinks = screen.getAllByRole('link', { name: /Daftar Instansi/i });
      expect(footerLinks.length).toBeGreaterThanOrEqual(2);

      const footerRegisterLink = footerLinks[footerLinks.length - 1];
      expect(footerRegisterLink.getAttribute('href')).toBe('/register');
    });
  });

  // ── 4. Target /register Page ──────────────────────────────────────────────
  describe('4. /register Presentation Target Page', () => {
    it('renders /register page with clear heading, notice, and navigation back/to login', async () => {
      await act(async () => {
        render(<RegisterPage />);
      });

      // Verify heading
      expect(screen.getByRole('heading', { name: /Daftar Instansi Pesantren/i })).toBeDefined();

      // Verify link to login
      const loginLinks = screen.getAllByRole('link', { name: /Masuk Portal/i });
      expect(loginLinks.length).toBeGreaterThanOrEqual(1);
      const toLogin = loginLinks.find((l) => l.getAttribute('href') === '/login');
      expect(toLogin).toBeDefined();

      // Verify link back to home
      const homeLink = screen.getByRole('link', { name: /Kembali ke Halaman Utama/i });
      expect(homeLink.getAttribute('href')).toBe('/');
    });
  });
});
