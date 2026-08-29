'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Building2, LogIn, Menu, X, ShieldCheck, Phone, ChevronRight } from 'lucide-react';
import type { TenantContext } from '@/lib/tenant/context';

interface HeaderProps {
  tenant: TenantContext;
}

export function TenantPortalHeader({ tenant }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const primaryColor = tenant.settings?.primaryColor || '#0F766E';
  const logoUrl = tenant.settings?.customLogoUrl;

  const navLinks = [
    { label: 'Beranda', href: '#hero' },
    { label: 'Profil', href: '#profil' },
    { label: 'Program', href: '#program' },
    { label: 'Prestasi', href: '#prestasi' },
    { label: 'Informasi', href: '#informasi' },
    { label: 'Kontak', href: '#kontak' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Tenant Logo & Name */}
          <Link href="/" className="flex items-center gap-3 group min-h-[44px]">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={tenant.name}
                className="w-10 h-10 object-contain rounded-xl border border-slate-200 p-0.5 shadow-sm group-hover:scale-105 transition-transform"
              />
            ) : (
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-emerald-900/10 group-hover:scale-105 transition-transform"
                style={{ backgroundColor: primaryColor }}
              >
                <Building2 className="w-5 h-5" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight leading-snug group-hover:text-emerald-700 transition-colors">
                {tenant.name}
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
                {tenant.settings?.tagline || 'Sistem Informasi Pesantren Terpadu'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all min-h-[44px] flex items-center"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Login CTA & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-sm text-white shadow-md hover:shadow-lg transition-all min-h-[44px] active:scale-95"
              style={{ backgroundColor: primaryColor }}
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk Portal</span>
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
              className="md:hidden p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top duration-200">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold text-sm min-h-[44px]"
            >
              <span>{link.label}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
          ))}
          <div className="pt-3 border-t border-slate-100">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-bold text-sm text-white shadow-md min-h-[44px]"
              style={{ backgroundColor: primaryColor }}
            >
              <LogIn className="w-4 h-4" />
              <span>Login Aplikasi Tenant</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
